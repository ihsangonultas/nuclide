/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {
  SetVariableResponse,
  RemoteObjectId,
} from 'nuclide-debugger-common/protocol-types';
import type Bridge from './Bridge';
import type DebuggerDispatcher, {DebuggerAction} from './DebuggerDispatcher';
import type {ScopeSection} from './types';

import UniversalDisposable from 'nuclide-commons/UniversalDisposable';
import nullthrows from 'nullthrows';
import {BehaviorSubject, Observable} from 'rxjs';
import {track} from '../../nuclide-analytics';
import {AnalyticsEvents} from './constants';
import {ActionTypes} from './DebuggerDispatcher';
import {reportError} from './Protocol/EventReporter';
import {DebuggerStore} from './DebuggerStore';

export type ScopesMap = Map<string, ScopeSection>;

export default class ScopesStore {
  _bridge: Bridge;
  _disposables: IDisposable;
  _debuggerStore: DebuggerStore;
  /**
   * Treat as immutable.
   */
  _scopes: BehaviorSubject<ScopesMap>;

  constructor(
    dispatcher: DebuggerDispatcher,
    bridge: Bridge,
    debuggerStore: DebuggerStore,
  ) {
    this._bridge = bridge;
    this._debuggerStore = debuggerStore;
    const dispatcherToken = dispatcher.register(this._handlePayload);
    this._disposables = new UniversalDisposable(() => {
      dispatcher.unregister(dispatcherToken);
    });
    this._scopes = new BehaviorSubject(new Map());
  }

  _handlePayload = (payload: DebuggerAction): void => {
    switch (payload.actionType) {
      case ActionTypes.CLEAR_INTERFACE:
      case ActionTypes.SET_SELECTED_CALLFRAME_INDEX:
        this._handleClearInterface();
        break;
      case ActionTypes.UPDATE_SCOPES:
        this._handleUpdateScopesAsPayload(payload.data);
        break;
      default:
        return;
    }
  };

  _handleClearInterface(): void {
    this._scopes.next(new Map());
  }

  _handleUpdateScopesAsPayload(scopeSections: Array<ScopeSection>): void {
    this._handleUpdateScopes(
      new Map(scopeSections.map(section => [section.name, section])),
    );
  }

  _handleUpdateScopes(scopeSections: ScopesMap): void {
    this._scopes.next(scopeSections);
  }

  getScopes(): Observable<ScopesMap> {
    return this._scopes.asObservable();
  }

  getScopesNow(): ScopesMap {
    return this._scopes.getValue();
  }

  supportsSetVariable(): boolean {
    return this._debuggerStore.supportsSetVariable();
  }

  // Returns a promise of the updated value after it has been set.
  async sendSetVariableRequest(
    scopeObjectId: RemoteObjectId,
    scopeName: string,
    expression: string,
    newValue: string,
  ): Promise<string> {
    const debuggerInstance = this._debuggerStore.getDebuggerInstance();
    if (debuggerInstance == null) {
      const errorMsg = 'setVariable failed because debuggerInstance is null';
      reportError(errorMsg);
      return Promise.reject(new Error(errorMsg));
    }
    track(AnalyticsEvents.DEBUGGER_EDIT_VARIABLE, {
      language: debuggerInstance.getProviderName(),
    });
    return new Promise((resolve, reject) => {
      function callback(error: Error, response: SetVariableResponse) {
        if (error != null) {
          const message = JSON.stringify(error);
          reportError(`setVariable failed with ${message}`);
          atom.notifications.addError(message);
          reject(error);
        } else {
          resolve(response.value);
        }
      }
      this._bridge.sendSetVariableCommand(
        Number(scopeObjectId),
        expression,
        newValue,
        callback,
      );
    }).then(confirmedNewValue => {
      this._setVariable(scopeName, expression, confirmedNewValue);
      return confirmedNewValue;
    });
  }

  _setVariable = (
    scopeName: string,
    expression: string,
    confirmedNewValue: string,
  ): void => {
    const scopes = this._scopes.getValue();
    const selectedScope = nullthrows(scopes.get(scopeName));
    const variableToChangeIndex = selectedScope.scopeVariables.findIndex(
      v => v.name === expression,
    );
    const variableToChange = nullthrows(
      selectedScope.scopeVariables[variableToChangeIndex],
    );
    const newVariable = {
      ...variableToChange,
      value: {
        ...variableToChange.value,
        value: confirmedNewValue,
        description: confirmedNewValue,
      },
    };
    selectedScope.scopeVariables.splice(variableToChangeIndex, 1, newVariable);
    this._handleUpdateScopes(scopes);
  };

  dispose(): void {
    this._disposables.dispose();
  }
}
