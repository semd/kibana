import type { PromQLAstNode } from '@elastic/esql';
import type { ESQLFunction, ESQLSingleAstItem, ESQLAstItem, ESQLCommandOption, ESQLAstHeaderCommand, ESQLAstQueryExpression } from '@elastic/esql/types';
export declare function isMarkerNode(node: ESQLAstItem | PromQLAstNode | undefined): boolean;
export declare function removeAutocompleteMarkers<T>(value: T): T;
/**
 * Unwraps expression-only parentheses from the AST, mutating the provided root in place.
 * @elastic/esql parser emits explicit parens nodes in the AST for grouping parentheses in expressions.
 * With the new behavior, command validators and autocomplete readers, which access expression arguments positionally, would see a parens wrapper node instead of the inner expression
 *
 */
export declare function unwrapExpressionParens(root: ESQLAstQueryExpression): ESQLAstQueryExpression;
export declare function findAstPosition(ast: ESQLAstQueryExpression, offset: number): {
    command: undefined;
    node: undefined;
    containingFunction?: undefined;
    option?: undefined;
} | {
    command: import("@elastic/esql/types").ESQLCommand<string> | ESQLAstHeaderCommand<string, ESQLSingleAstItem>;
    containingFunction: ESQLFunction<import("@elastic/esql/types").FunctionSubtype, string> | undefined;
    option: ESQLCommandOption | undefined;
    node: ESQLSingleAstItem | undefined;
};
/**
 * This function returns a list of closing brackets that can be appended to
 * a partial query to make it valid.
 *
 * A known limitation of this is that is not aware of commas "," or pipes "|"
 * so it is not yet helpful on a multiple commands errors (a workaround is to pass each command here...)
 *
 * It does not autocomplete missing brackets within quotes or triple quotes.
 * @param text
 * @returns
 */
export declare function getBracketsToClose(text: string): string[];
/**
 * This function attempts to correct the syntax of a partial query to make it valid.
 *
 * We are generally dealing with incomplete queries when the user is typing. But,
 * having an AST is helpful so we heuristically correct the syntax so it can be parsed.
 */
export declare function correctQuerySyntax(query: string): string;
/**
 * Corrects partial PromQL syntax so the PromQL parser can build a stable AST while typing.
 * It keeps the same marker semantics used in ES|QL correction, but only for trailing
 * separators relevant to PromQL argument/subquery contexts.
 */
export declare function correctPromqlQuerySyntax(query: string): string;
export declare function getPromqlBracketsToClose(text: string): string;
