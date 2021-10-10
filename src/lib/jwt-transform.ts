import { STIs } from "./stis"
import type { JWTPayload } from "jose/types"
import { formatDistanceToNowStrict } from 'date-fns'

type Payload = JWTPayload & {
  dot: number,
  res: {
    [key: string]: boolean
  }
}

export default function transform(jwtPayload: Payload): Result {
  const date = new Date(jwtPayload.dot.toString()
    .replace(/(\d\d)(\d\d)(\d\d)/, "20$1-$2-$3"))

  const stis = {}

  for (const [key, result] of Object.entries(jwtPayload.res)) {
    stis[STIs[key]] = result
  }
  
  return {
    date,
    name: jwtPayload.sub,
    tested_around: formatDistanceToNowStrict(date, { addSuffix: true }),
    stis
  }
}
