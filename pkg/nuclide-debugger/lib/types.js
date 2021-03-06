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

/* eslint-disable no-unused-vars */

import type {IconName} from 'nuclide-commons-ui/Icon';
import type {Observable} from 'rxjs';
import type {RemoteObjectId} from 'nuclide-debugger-common/protocol-types';

export type ControlButtonSpecification = {
  icon: IconName,
  title?: string,
  onClick: () => mixed,
};

/* Evaluation & values */
export type EvaluationResult = {
  type: string,
  // Either:
  value?: string,
  // Or:
  description?: string,
  objectId?: string,
  subtype?: string,
};

export type ExpansionResult = Array<{
  name: string,
  value: EvaluationResult,
}>;

export type ScopeSection = {
  name: string,
  scopeObjectId: RemoteObjectId,
  scopeVariables: ExpansionResult,
};

export type Expression = string;
export type EvaluatedExpression = {
  expression: Expression,
  value: Observable<?EvaluationResult>,
};
export type EvaluatedExpressionList = Array<EvaluatedExpression>;
export type EvalCommand =
  | 'evaluateOnSelectedCallFrame'
  | 'getProperties'
  | 'runtimeEvaluate'
  | 'setVariable';
export type ExpressionResult = ChromeProtocolResponse & {
  expression: string,
};

export type GetPropertiesResult = ChromeProtocolResponse & {
  objectId: string,
};

export type ChromeProtocolResponse = {
  result: ?EvaluationResult | ?GetPropertiesResult,
  error: ?Object,
};

/* Breakpoints */
export type FileLineBreakpoint = {
  id: number,
  path: string,
  line: number,
  condition: string,
  enabled: boolean,
  resolved: boolean,
  hitCount?: number,
};
export type FileLineBreakpoints = Array<FileLineBreakpoint>;

export type IPCEvent = {
  channel: string,
  args: any[],
};

// TODO: handle non file line breakpoints.
export type IPCBreakpoint = {
  sourceURL: string,
  lineNumber: number,
  condition: string,
  enabled: boolean,
  resolved: boolean,
};

export type BreakpointUserChangeArgType = {
  action: string,
  breakpoint: FileLineBreakpoint,
};

export type SerializedWatchExpression = string;

export type SerializedBreakpoint = {
  line: number,
  sourceURL: string,
  disabled: ?boolean,
  condition: ?string,
};

/* Callstack */
export type CallstackItem = {
  name: string,
  location: {
    path: string,
    line: number,
    column?: number,
    hasSource?: boolean,
  },
  disassembly?: FrameDissassembly,
  registers?: RegisterInfo,
};

export type Callstack = Array<CallstackItem>;

/* ThreadStore Types */
export type ThreadItem = {
  id: string,
  name: string,
  address: string,
  location: {
    scriptId: string,
    lineNumber: number,
    columnNumber: number,
  },
  stopReason: string,
  description: string,
};

export type NuclideThreadData = {
  threads: Array<ThreadItem>,
  owningProcessId: number,
  stopThreadId: number,
  selectedThreadId: number,
};

export type ThreadSwitchMessageData = {
  sourceURL: string,
  lineNumber: number,
  message: string,
};

/* Debugger mode */
export type DebuggerModeType =
  | 'starting'
  | 'running'
  | 'paused'
  | 'stopping'
  | 'stopped';

export type ObjectGroup = 'watch-group' | 'console';

/* disassembly info */
export type FrameDissassembly = {
  frameTitle: string,
  metadata: Array<{name: string, value: string}>,
  currentInstructionIndex: number,
  instructions: Array<{
    address: string,
    instruction: string,
    offset?: string,
    comment?: string,
  }>,
};

/* Register info */
export type RegisterInfo = Array<{
  groupName: string,
  registers: Array<{name: string, value: string}>,
}>;
