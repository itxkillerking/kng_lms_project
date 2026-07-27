# Default imports for the project package

# Import the signals to ensure they are registered globally
try:
    import kng_lms.signals
except ImportError:
    pass
