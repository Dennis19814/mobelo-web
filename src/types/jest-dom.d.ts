import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toBeVisible(): R
      toBeEmpty(): R
      toBeDisabled(): R
      toBeEnabled(): R
      toBeInvalid(): R
      toBeRequired(): R
      toBeValid(): R
      toContainElement(element: HTMLElement | null): R
      toContainHTML(htmlText: string): R
      toHaveAttribute(attr: string, value?: any): R
      toHaveClass(...classNames: string[]): R
      toHaveFocus(): R
      toHaveFormValues(expectedValues: Record<string, any>): R
      toHaveStyle(css: string | Record<string, any>): R
      toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): R
      toHaveValue(value: string | string[] | number): R
      toHaveDisplayValue(value: string | string[]): R
      toBeChecked(): R
      toBePartiallyChecked(): R
      toHaveDescription(text: string | RegExp): R
      toHaveErrorMessage(text: string | RegExp): R
      toBeEmptyDOMElement(): R
      toBeInTheDOM(): R
      toHaveAccessibleDescription(text: string | RegExp): R
      toHaveAccessibleName(text: string | RegExp): R
    }
  }
}