// This file was auto-generated by 'typesafe-i18n'. Any manual changes will be overwritten.
/* eslint-disable */

import type { LocalizedString } from 'typesafe-i18n'

export type BaseLocale = 'en'

export type Locales =
	| 'en'
	| 'nl'

export type Translation = {
	/**
	 * Hello {name}
	 * @param {string} name
	 */
	'HI': RequiredParams1<'name'>
}

export type TranslationFunctions = {
	/**
	 * Hello {name}
	 */
	'HI': (arg: { name: string }) => LocalizedString
}

export type Formatters = {}

type Param<P extends string> = `{${P}}`

type Params1<P1 extends string> =
	`${string}${Param<P1>}${string}`

type RequiredParams1<P1 extends string> =
	| Params1<P1>