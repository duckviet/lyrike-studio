import type { MessageKeys, NestedKeyOf } from "next-intl";

export type TI18nMessageKeys<T> = MessageKeys<T, NestedKeyOf<T>>;
