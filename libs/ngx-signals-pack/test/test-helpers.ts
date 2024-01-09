import { SchedulerLike } from "rxjs";
import { defaultScheduler } from "../src";

/**
 * Waits for the next tick of the given scheduler.
 * The default is the same default scheduler used by the async signal.
 * @param scheduler 
 * @returns 
 */
export function nextSchedulerTick(scheduler: SchedulerLike = defaultScheduler) {
  return new Promise(resolve => scheduler.schedule(resolve));
}