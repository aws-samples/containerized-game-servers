FROM gcr.io/kubeflow-images-public/tensorflow-1.15.2-notebook-cpu:1.0.0
USER root
RUN /usr/bin/python3 -m pip install --upgrade pip
RUN pip install awscli
RUN pip install pyspark
RUN pip install findspark

RUN wget http://archive.apache.org/dist/spark/spark-2.4.0/spark-2.4.0-bin-hadoop2.6.tgz
RUN tar xvzf spark-2.4.0-bin-hadoop2.6.tgz
RUN mv spark-2.4.0-bin-hadoop2.6 /opt/spark-2.4.0
RUN ln -s /opt/spark-2.4.0 /opt/spark
RUN rm spark-2.4.0-bin-hadoop2.6.tgz
RUN export SPARK_HOME=/opt/spark
RUN export PATH=$SPARK_HOME/bin:$PATH
RUN apt-get update -y
RUN apt-get install -y openjdk-8-jre
RUN apt-get install -y gcc 
RUN sudo apt-get install python3 python-dev python3-dev \
     build-essential libssl-dev libffi-dev \
     libxml2-dev libxslt1-dev zlib1g-dev \
     python-pip
RUN pip install pywinrm[kerberos]
RUN pip install sparkmagic
