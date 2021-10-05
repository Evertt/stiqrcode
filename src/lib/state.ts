import writable from "./store"

interface State {
  code?: string
  private_key?: string
  tests: string[]
}

export default writable<State>('stiqrcode', { tests: [] })
