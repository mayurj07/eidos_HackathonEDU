/**
 * Created by mjain on 10/24/15.
 */

var unirest = require('unirest');


exports.getWordDesc = function (req, res) {
    var Card = req.app.db.models.Card;
    var keyword = req.query.keyword;
    var colors = ['red', 'blue', 'green'];

    Card.findOne({"keyword": keyword}, function (err, card) {
        if (err) {
            console.log('Error in finding card error: ' + err);
            res.status(204).send('card error');
        }

        if (card) {
            console.log(card);
            res.status(200).send(card);
        } else {
            // These code snippets use an open-source library. http://unirest.io/nodejs
            unirest.get("https://wordsapiv1.p.mashape.com/words/" + keyword + "/definitions")
                .header("X-Mashape-Key", "q3YhYwtuqVmshHEKKF1Nhpr3DYWNp1CN4EYjsnUdlujyx7tgj1")
                .header("Accept", "application/json")
                .end(function (result) {
                    //console.log(result);
                    //console.log(result.status, result.headers, result.body);

                    if(result.body.definitions != undefined){
                        var newCard = new Card({
                            "keyword": keyword,
                            "description": result.body.definitions[0].definition,
                            "image": "http://ummeedhyderabad.com/images/upload/default.jpg",
                            "source_url": "source_url",
                            "color": colors[Math.floor(Math.random() * colors.length)]
                        });

                        newCard.save(function (err, newcard) {
                            if (err) {
                                console.log("error: " + err);
                            }
                            console.log(newcard);
                            res.status(200).send(newcard);
                        });
                    }
                    else{
                        console.log("Word not found.");
                        res.status(404).send("Word not found.");
                    }
                });
        }
    });
};


exports.getAllCards = function (req, res) {
    var Card = req.app.db.models.Card;

    Card.find({}).sort([['created_at', -1]]).exec(function (err, card) {
        if (err) {
            console.log('Error in finding card error: ' + err);
            res.status(204).send('card error');
        }

        if (card) {
            console.log(card);
            res.status(200).send(card);
        }
    });
};
