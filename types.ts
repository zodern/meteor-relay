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
  <S extends z.ZodTypeAny, R1,>(config: { name: string | null, schema: S, rateLimit?: { interval: number, limit: number }, run: [(this: Subscription, input: z.output<S>, context: PipelineContext<z.output<S>>) => R1,] }): Subscribe<S> ;
  <S extends z.ZodTypeAny, R1,R2,>(config: { name: string | null, schema: S, rateLimit?: { interval: number, limit: number }, run: [(this: Subscription, input: z.output<S>, context: PipelineContext<z.output<S>>) => R1,(this: Subscription, input: R1, context: PipelineContext<z.output<S>>) => R2,] }): Subscribe<S> ;
  <S extends z.ZodTypeAny, R1,R2,R3,>(config: { name: string | null, schema: S, rateLimit?: { interval: number, limit: number }, run: [(this: Subscription, input: z.output<S>, context: PipelineContext<z.output<S>>) => R1,(this: Subscription, input: R1, context: PipelineContext<z.output<S>>) => R2,(this: Subscription, input: R2, context: PipelineContext<z.output<S>>) => R3,] }): Subscribe<S> ;
  <S extends z.ZodTypeAny, R1,R2,R3,R4,>(config: { name: string | null, schema: S, rateLimit?: { interval: number, limit: number }, run: [(this: Subscription, input: z.output<S>, context: PipelineContext<z.output<S>>) => R1,(this: Subscription, input: R1, context: PipelineContext<z.output<S>>) => R2,(this: Subscription, input: R2, context: PipelineContext<z.output<S>>) => R3,(this: Subscription, input: R3, context: PipelineContext<z.output<S>>) => R4,] }): Subscribe<S> ;
  <S extends z.ZodTypeAny, R1,R2,R3,R4,R5,>(config: { name: string | null, schema: S, rateLimit?: { interval: number, limit: number }, run: [(this: Subscription, input: z.output<S>, context: PipelineContext<z.output<S>>) => R1,(this: Subscription, input: R1, context: PipelineContext<z.output<S>>) => R2,(this: Subscription, input: R2, context: PipelineContext<z.output<S>>) => R3,(this: Subscription, input: R3, context: PipelineContext<z.output<S>>) => R4,(this: Subscription, input: R4, context: PipelineContext<z.output<S>>) => R5,] }): Subscribe<S> ;
}
type Call<S extends z.ZodUndefined | z.ZodTypeAny , T> = (...args: S extends z.ZodUndefined ? [] : [z.input<S>]) => Promise<T>;

export interface CreateMethod {
  <S extends z.ZodTypeAny, T>(config: { name: string, schema: S, rateLimit?: { interval: number, limit: number }, run: (this: Meteor.MethodThisType, args: z.output<S>) => T }): Call<S, T> ;

  <S extends z.ZodTypeAny, R1,>(config: { name: string, schema: S, rateLimit?: { interval: number, limit: number }, run: [(this: Meteor.MethodThisType, input: Awaited<z.output<S>>, context: PipelineContext<z.output<S>>) => R1,] }): Call<S, R1> ;
  <S extends z.ZodTypeAny, R1,R2,>(config: { name: string, schema: S, rateLimit?: { interval: number, limit: number }, run: [(this: Meteor.MethodThisType, input: Awaited<z.output<S>>, context: PipelineContext<z.output<S>>) => R1,(this: Meteor.MethodThisType, input: Awaited<R1>, context: PipelineContext<z.output<S>>) => R2,] }): Call<S, R2> ;
  <S extends z.ZodTypeAny, R1,R2,R3,>(config: { name: string, schema: S, rateLimit?: { interval: number, limit: number }, run: [(this: Meteor.MethodThisType, input: Awaited<z.output<S>>, context: PipelineContext<z.output<S>>) => R1,(this: Meteor.MethodThisType, input: Awaited<R1>, context: PipelineContext<z.output<S>>) => R2,(this: Meteor.MethodThisType, input: Awaited<R2>, context: PipelineContext<z.output<S>>) => R3,] }): Call<S, R3> ;
  <S extends z.ZodTypeAny, R1,R2,R3,R4,>(config: { name: string, schema: S, rateLimit?: { interval: number, limit: number }, run: [(this: Meteor.MethodThisType, input: Awaited<z.output<S>>, context: PipelineContext<z.output<S>>) => R1,(this: Meteor.MethodThisType, input: Awaited<R1>, context: PipelineContext<z.output<S>>) => R2,(this: Meteor.MethodThisType, input: Awaited<R2>, context: PipelineContext<z.output<S>>) => R3,(this: Meteor.MethodThisType, input: Awaited<R3>, context: PipelineContext<z.output<S>>) => R4,] }): Call<S, R4> ;
  <S extends z.ZodTypeAny, R1,R2,R3,R4,R5,>(config: { name: string, schema: S, rateLimit?: { interval: number, limit: number }, run: [(this: Meteor.MethodThisType, input: Awaited<z.output<S>>, context: PipelineContext<z.output<S>>) => R1,(this: Meteor.MethodThisType, input: Awaited<R1>, context: PipelineContext<z.output<S>>) => R2,(this: Meteor.MethodThisType, input: Awaited<R2>, context: PipelineContext<z.output<S>>) => R3,(this: Meteor.MethodThisType, input: Awaited<R3>, context: PipelineContext<z.output<S>>) => R4,(this: Meteor.MethodThisType, input: Awaited<R4>, context: PipelineContext<z.output<S>>) => R5,] }): Call<S, R5> ;
}
