# Drop Compiler

To make things easier at the beginning, the compiler will at first continue
with the approach used by v0.1:

1. Pre-process decorators and transform them into HTML tags and store
   unprocessed raw expressions with HTML attributes.
2. Parse transformed HTML with native DOM element, and then take advantages of
   `element.getElementsByTagName` to locate decorators.
3. Initialize decorators and parse expressions.
