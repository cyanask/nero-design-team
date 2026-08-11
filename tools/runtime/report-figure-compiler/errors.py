"""Compiler error types shared across public seams."""


class FigureCompilerError(RuntimeError):
    """Expected user-facing compiler failure."""


class SpecValidationError(FigureCompilerError):
    """The input specification does not satisfy the public contract."""


class LayoutError(FigureCompilerError):
    """The validated specification cannot fit the selected profile."""


class RendererUnavailableError(FigureCompilerError):
    """The requested renderer is unavailable in the selected runtime."""
