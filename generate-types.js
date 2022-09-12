if (typeof Meteor !== 'undefined') {
  throw new Error('This file should not be imported by a Meteor app');
}

const fs = require('fs');
const path = require('path');

const outFile = path.resolve(__dirname, './types.ts');

let content = `
// Do not manually modify this file. Instead, use ./generate-types.js
import type * as z from "zod";
import type { Subscription } from 'meteor/meteor';

export interface SubscriptionCallbacks {
  onStop?: (err?: any) => void,
  onReady?: () => void
}

interface PipelineContext<T> {
  originalInput: any,
  name: string | null;
  onError: (err: any) => any;
  onResult: (result: any) => void;
}

type Subscribe<S extends z.ZodTypeAny> = (...args: S extends z.ZodUndefined ? [SubscriptionCallbacks?] : [z.input<S>, SubscriptionCallbacks?]) => Meteor.SubscriptionHandle
export interface CreatePublication {
  <S extends z.ZodTypeAny, T>(config: { name: string | null, schema: S, rateLimit?: { interval: number, limit: number }, run: (this: Subscription, args: z.output<S>) => T }): Subscribe<S> ;
`.trim();

for(let i = 0; i < 5; i++) {
  let generics = '<S extends z.ZodTypeAny, ';
  let run = '[';

  let prevOutput = 'z.output<S>';
  for(let x = 0; x < i + 1; x++) {
    let output = 'R' + (x + 1);
    generics += output + ',';
    run += `(this: Subscription, input: ${prevOutput}, context: PipelineContext<z.output<S>>) => ${output},`
    prevOutput = output;
  }
  generics += '>';
  run += ']';

  content += `
  ${generics}(config: { name: string | null, schema: S, rateLimit?: { interval: number, limit: number }, run: ${run} }): Subscribe<S> ;`
}

content += `
}
type Call<S extends z.ZodUndefined | z.ZodTypeAny , T> = (...args: S extends z.ZodUndefined ? [] : [z.input<S>]) => Promise<T>;

export interface CreateMethod {
  <S extends z.ZodTypeAny, T>(config: { name: string, schema: S, rateLimit?: { interval: number, limit: number }, run: (this: Meteor.MethodThisType, args: z.output<S>) => T }): Call<S, T> ;
`
for (let i = 0; i < 5; i++) {
  let generics = '<S extends z.ZodTypeAny, ';
  let run = '[';

  let prevOutput = 'z.output<S>';
  for (let x = 0; x < i + 1; x++) {
    let output = 'R' + (x + 1);
    generics += output + ',';
    run += `(this: Meteor.MethodThisType, input: Awaited<${prevOutput}>, context: PipelineContext<z.output<S>>) => ${output},`
    prevOutput = output;
  }
  generics += '>';
  run += ']';

  content += `
  ${generics}(config: { name: string, schema: S, rateLimit?: { interval: number, limit: number }, run: ${run} }): Call<S, ${prevOutput}> ;`
}


content += '\n}';
console.log(content);

fs.writeFileSync(outFile, content);
