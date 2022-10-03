FROM arm64v8/python:2
RUN apt-get update -y
RUN apt-get install -y sqlite3 
RUN apt-get install -y vim net-tools telnet
RUN /usr/local/bin/python -m pip install --upgrade pip
ADD deps /deps
ADD src /src
ADD server.py /server.py
ADD world.py /world.py
RUN gcc -std=c99 -O3 -fPIC -shared -o world -I src -I deps/noise deps/noise/noise.c src/world.c
RUN pip install requests boto3 psycopg2
RUN pip install awscli

CMD ["python","/server.py"]
