# Use an official Node.js runtime as the base image
FROM node:14

# Set the working directory within the Docker image
WORKDIR /app

# Copy the package.json file to the Docker image
COPY package.json .

# Install the dependencies listed in the package.json file
RUN npm install

# Copy the rest of the application code to the Docker image
COPY . .

# Specify the command to run the application when the Docker image is started as a container
CMD [ "npm", "start" ]


# build docker image
# docker build -t url-shortner-app .

# run docker image
# docker run -p 3000:3000 url-shortner-app

# stop running docker image
# docker stop [container_id]

# list all running docker images
# docker ps