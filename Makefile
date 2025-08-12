.PHONY: dev run-frontend run-backend run-voice test lint fmt clean setup-node setup-backend setup-voice

# Run all three apps concurrently
dev:
	npm run dev

setup-node:
	npm install
	cd packages/shared && npm run build
	cd apps/frontend && npm run embed:drinks

run-frontend:
	cd apps/frontend && npm run dev

setup-backend:
	cd apps/backend && python -m pip install -r requirements.txt

run-backend:
	cd apps/backend && python -m uvicorn app.main:app --reload --port 8000

setup-voice:
	cd apps/voice && python -m pip install -r requirements.txt

run-voice:
	cd apps/voice && python -m voice.app

test:
	$(MAKE) -j 2 test-backend test-frontend

.PHONY: test-backend test-frontend
test-backend:
	cd apps/backend && pytest -q

test-frontend:
	cd apps/frontend && npm run test --silent

lint:
	$(MAKE) -j 2 lint-backend lint-frontend

.PHONY: lint-backend lint-frontend
lint-backend:
	python -m pip install -q ruff black isort
	ruff check .
	black --check .
	isort --check-only .

lint-frontend:
	cd apps/frontend && npm run lint

fmt:
	ruff check . --fix && black . && isort .

clean:
	find . -name "__pycache__" -type d -exec rm -rf {} + || true
	find . -name ".pytest_cache" -type d -exec rm -rf {} + || true
