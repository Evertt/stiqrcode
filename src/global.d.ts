/// <reference types="@sveltejs/kit" />

interface User {
  uid: string
  email?: string
  displayName?: string
}

interface Locals {
	user?: User
}

interface Code {
  uid: string
  test: string
  tester_id?: string
  tester_name?: string
  status?: "confirming"|"confirmed"
}

interface Result {
  date: Date
  name: string
  tested_around: string
  stis: {
    [key: string]: boolean
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Session extends Locals {}

module "virtual:windi-devtools" {}

declare namespace svelte.JSX {
	export declare type UtilityNames =
    | 'p' | 'm' | 'w' | 'h' | 'z'
    | 'border' | 'grid' | 'flex'
    | 'bg' | 'text' | 'font'
    | 'opacity' | 'animate'
    | 'transition' | 'transform'
    | 'align' | 'justify' | 'content'
    | 'pos' | 'box' | 'overflow'
    | 'underline' | 'list' | 'gradient'
    | 'divide' | 'gap' | 'ring' | 'icon'
    | 'container' | 'space' | 'table'
    | 'order' | 'place' | 'display'
    | 'shadow' | 'blend' | 'filter'
    | 'backdrop' | 'cursor' | 'outline' | 'select'

	export declare type VariantNames =
    | 'hover' | 'active' | 'focus'
    | 'enabled' | 'dark' | 'light'
    | 'sm' | 'lg' | 'md' | 'xl' | 'xxl'
    | 'first' | 'last' | 'child' | 'root'
    | 'before' | 'after' | 'all'
	
  export declare type AttributifyNames<Prefix extends string = ''> =
    | `${Prefix}${UtilityNames}`
    | `${Prefix}${VariantNames}${Capitalize<UtilityNames>}`
    | `${Prefix}${VariantNames}`
    | `${Prefix}${VariantNames}${Capitalize<VariantNames>}`
    | `${Prefix}${Capitalize<UtilityNames>}`
    | `${Prefix}${Capitalize<VariantNames>}${Capitalize<UtilityNames>}`
    | `${Prefix}${Capitalize<VariantNames>}`
    | `${Prefix}${Capitalize<VariantNames>}${Capitalize<VariantNames>}`

	export type HTMLProps<T extends EventTarget> = HTMLAttributes<T> & Partial<Record<AttributifyNames, ClassName>>
}
