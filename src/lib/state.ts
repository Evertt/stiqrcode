import writable from "./store"

interface State {
  id?: string
  code?: string
  private_key?: string
  tests: string[]
}

export default writable<State>('stiqrcode', { tests: [] })
