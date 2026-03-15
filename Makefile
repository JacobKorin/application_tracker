PYTHON ?= python3

.PHONY: test lint run-gateway run-identity run-application run-notification

test:
	$(PYTHON) -m pytest backend/services

lint:
	$(PYTHON) -m compileall backend

run-gateway:
	$(PYTHON) backend/services/api-gateway/wsgi.py

run-identity:
	$(PYTHON) backend/services/identity-service/wsgi.py

run-application:
	$(PYTHON) backend/services/application-service/wsgi.py

run-notification:
	$(PYTHON) backend/services/notification-service/wsgi.py

