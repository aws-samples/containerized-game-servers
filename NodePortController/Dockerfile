FROM python:3.7
COPY /src/ /src/
WORKDIR /src
RUN pip install -r requirements.txt
EXPOSE 8080
CMD kopf run --liveness=http://0.0.0.0:8080/healthz --verbose main.py