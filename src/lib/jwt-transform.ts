import type { JWTPayload } from "jose/types"
import { formatDistanceToNow } from 'date-fns'

type Payload = JWTPayload & { dot: number }

export default function transform(jwtPayload: Payload): Result {
  const date = new Date(jwtPayload.dot.toString()
    .replace(/(\d\d)(\d\d)(\d\d)/, "20$1-$2-$3"))
  return {
    date,
    result: false,
    name: jwtPayload.sub,
    tested_around: formatDistanceToNow(date, { addSuffix: true })
  }
}
