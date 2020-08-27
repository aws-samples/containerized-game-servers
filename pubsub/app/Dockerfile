# Python image to use.
FROM python:3.8

# Set the working directory to /app
WORKDIR /app

# copy the requirements file used for dependencies
COPY ["requirements.txt", "boto3-1.14.11.tar.gz", "botocore-1.17.11.tar.gz", "./"]

# Install updated boto libraries
RUN pip install ./boto3-1.14.11.tar.gz
RUN pip install ./botocore-1.17.11.tar.gz

# Install any needed packages specified in requirements.txt
RUN pip install --trusted-host pypi.python.org -r requirements.txt

# Copy the rest of the working directory contents into the container at /app
COPY . .

# Run app.py when the container launches
ENTRYPOINT ["python", "-u", "main.py"]