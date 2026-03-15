PYTHON ?= python3

.PHONY: test lint run-backend

test:
	$(PYTHON) -m pytest backend/services

lint:
	$(PYTHON) -m compileall backend

run-backend:
	$(PYTHON) backend/services/backend/wsgi.py
