require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const dns = require("dns");
const url = require("url");
const { hostname } = require("os");
const shortid = require("shortid");
const mongoose = require("mongoose");
const moment = require("moment");
const connectMongo = require("./urlSchema");

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/public", express.static(`${process.cwd()}/public`));
app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// retrieve the connection status to Mongo
const connectionStatus = connectMongo();

// Basic Configuration
const port = process.env.PORT || 3000;

// define Url Schema
const urlSchema = new mongoose.Schema({
  urlId: {
    type: String,
    required: true,
  },
  origUrl: {
    type: String,
    required: true,
  },
  shortUrl: {
    type: String,
    required: true,
  },
  clicks: {
    type: Number,
    required: false,
    default: 0,
  },
  date: {
    type: Date,
    required: true,
  },
});

// now we define the Url Model
const urlModel = mongoose.model("urlModel", urlSchema);

// now we define a createAndSaveUrl function
const createAndSaveUrl = async (shortId, origUrl, path, res) => {
  let url_obj = new urlModel({
    urlId: shortId,
    origUrl: origUrl,
    shortUrl: path + shortId,
    date: moment().format(),
  });

  url_obj.save(function (err, data) {
    if (err) {
      console.error(err);
    } else {
      console.log(`the save was successful. logging data ${data}`);
      res.json({
        original_url: data.origUrl,
        short_url: data.shortUrl,
      });
      return data;
    }
  });
};

// find single URL string.
const findOneByUrl = async (urlStr) => {
  try {
    const data = await urlModel.findOne({ origUrl: urlStr });
    console.log("We found that URL: " + urlStr);
    return data;
  } catch (err) {
    console.log(err + " : Sorry we were unable to find that URL: " + urlStr);
    return null;
  }  
}

// find a single short URL.
const findOneByShortUrl = async (shortId) => {
  try {
    const data = await urlModel.findOne({ urlId: shortId });
    console.log("We found that URL: " + shortId);
    return data;
  } catch (err) {
    console.log(err + " : Sorry we were unable to find any URLs with that Id: " + shortId);
  }
};

// use url.parse for parsing the input Url.
const checkHostname = (domain) => {
  const parsedUrl = url.parse(domain);

  // regex expression to validate URLs
  const regex =
    /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;

  if (!regex.test(domain)) {
    console.log(domain + " is not a valid URL.");
    return null;
  } else {
    const hostname = parsedUrl.hostname;
    console.log(`logging hostname value....${hostname}`);
    return hostname;
  }
};

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

// app.get endpoint to retrieve shortened URL
  app.get("/:shortId", async (req, res) => {
    const shortId = req.params.shortId;
    const findById = await findOneByShortUrl(shortId);
    console.log("Logging original URL: " + findById.origUrl);
    res.redirect(findById.origUrl);
  });

// app.get endpoint for Search functionality
app.get("/api/search/", async (req, res) => {  
  const shortId = req.query.shortId;  
  const findById = await findOneByShortUrl(shortId);
  console.log('Logging original URL: ' + findById.origUrl);
  res.redirect(findById.origUrl);
});

// POST api/shorturl Endpoint.
  app.post("/", async (req, res) => {
  connectionStatus.then(async (status) => {
    if (status) {
      // retrieve the url from body text
      const inUrl = req.body.url;

      // log the input param to the console
      console.log(`input url is: ${inUrl}`);

      // retrieve the hostname from the input url
      returnedUrl = checkHostname(inUrl);

      // check whether the returnedUrl is not null
      if (returnedUrl) {
        // generate the shortid value
        const shortId = shortid.generate();

        // lookup the URL in MongoDb to see if it exists.
        const findByUrl = await findOneByUrl(inUrl);

        // check if we returned data from MongoDb.
        if (findByUrl !== null) {
          res.json({
            original_url: findByUrl.origUrl,
            short_url: findByUrl.shortUrl,
          });
        } else {
          // Create and Save new URL to Mongo.
          const createAndSave = await createAndSaveUrl(
            shortId,
            inUrl,
            req.headers.host + req.path,
            res
          );
        }
      } else {
        res.json({ error: "invalid url" });
      }
    } else {
      res.json({ error: "There was a problem connecting to MongoDb." });
    }
  });
});

// Respond not found to all the wrong routes
app.use(function (req, res, next) {
  res.status(404);
  res.type("txt").send("We are sorry, but that URL was Not found.");
});

// Error Middleware
app.use(function (err, req, res, next) {
  if (err) {
    res
      .status(err.status || 500)
      .type("txt")
      .send(err.message || "SERVER ERROR");
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

/* TO DO:
1. Validate for incomplete Urls like; http://datadriveninvestor - DONE 30 Jan 2023
2. Once valid URL check passes, lookup the incoming URL in the Db to check if it already exists.
   - If the URL doesnt' exist, add a new record. call createAndSaveUrl(shortId, inUrl, req.headers.host + req.path); - DONE 31 Jan 2023
   - If the URL does exist, return the shortened URL form. - DONE 01 Feb 2023
3. Change default date on Mongo to local standard time, not UTC time. - DONE 01 Feb 2023
4. Connect to MongoDb only once at the very beginning and re-use the open connection - DONE 01 Feb 2023
5. 
*/
