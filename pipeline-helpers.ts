import { PipelineContext } from './types';

type Step<I, R> = (this: Subscription | Meteor.MethodThisType, input: I, context: PipelineContext<unknown>) => R 

const Pipeline = Symbol('zodern:relay:pipeline');

export function partialPipeline<I, R1>(step1: Step<I, R1>): (input: I) => R1
export function partialPipeline<I, R1, R2>(step1: Step<I, R1>, step2: Step<Awaited<R1>, R2>): (input: I) => R2
export function partialPipeline<I, R1, R2, R3>(step1: Step<I, R1>, step2: Step<Awaited<R1>, R2>, step3: Step<Awaited<R2>, R3>): (input: I) => R3
export function partialPipeline<I, R1, R2, R3, R4>(step1: Step<I, R1>, step2: Step<Awaited<R1>, R2>, step3: Step<Awaited<R2>, R3>, step4: Step<Awaited<R3>, R4>): (input: I) => R4
export function partialPipeline<I, R1, R2, R3, R4, R5>(step1: Step<I, R1>, step2: Step<Awaited<R1>, R2>, step3: Step<Awaited<R2>, R3>, step4: Step<Awaited<R3>, R4>, step5: Step<Awaited<R4>, R5>): (input: I) => R5
export function partialPipeline<I, R1, R2, R3, R4, R5, R6>(step1: Step<I, R1>, step2: Step<Awaited<R1>, R2>, step3: Step<Awaited<R2>, R3>, step4: Step<Awaited<R3>, R4>, step5: Step<Awaited<R4>, R5>, step6: Step<Awaited<R5>, R6>): (input: I) => R6
export function partialPipeline(...steps: any[]): (input: any) => any {
  const fn = (input: any) => {
    throw new Error('partial pipelines should not be called directly');
  };

  (fn as any)[Pipeline] = steps;

  return fn;
}

export function flattenPipeline(pipeline: any[]) {
  let result: Function[] = [];

  for(const step of pipeline) {
    if (step[Pipeline]) {
      result.push(...flattenPipeline(step[Pipeline]));
    } else {
      result.push(step);
    }
  }

  return result;
}
