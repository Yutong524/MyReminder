import { fromZonedTime } from "date-fns-tz";

export function localToUtc(localISO, timeZone) {
    return fromZonedTime(localISO, timeZone);
}
