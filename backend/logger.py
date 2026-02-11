import logging
import os


def setup_logger(name: str) -> logging.Logger:
    """
    Create and configure a logger with the specified name.

    Args:
        name: The name of the logger (typically __name__ of the calling module)

    Returns:
        Configured logger instance

    The log level can be controlled via the LOG_LEVEL environment variable.
    Example: LOG_LEVEL=DEBUG python main.py
    """
    logger = logging.getLogger(name)
    level = os.getenv("LOG_LEVEL", "INFO")
    logger.setLevel(getattr(logging, level))

    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger
