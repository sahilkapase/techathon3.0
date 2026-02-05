const cultivatedarea = require('../models/cultivatedarea');
const irigation = require('../models/irigation');
const APYDATA = require('../models/apy');
const district_wise_soil = require('../models/districtwise_soil');

//Cultivated and non cultivated area district wise
module.exports.cultivatedareafun = function (req, res) {
    try {
        cultivatedarea.find({ District: req.params.District }, function (err, data) {
            if (err) {
                console.log(err);
                return res.json({
                    error: "Something went wrong please try again after some time",
                    status: "error"
                });
            }
            else {
                return res.json(data);
            }
        })
    }
    catch (err) {
        console.log(err);
        return res.json({
            error: "Something went wrong please try again after some time",
            status: "error"
        });
    }
};

//District wise available Irigation sources 
module.exports.irigationfun = function (req, res) {
    try {

        irigation.find({ District: req.params.District }, function (err, data) {
            if (err) {
                return res.json({
                    error: "Something went wrong please try again after sometime",
                    status: "error"
                })
            }
            else {
                return res.json(data);
            }
        });
    }
    catch (err) {
        console.log(err);
        return res.json({
            error: "Something went wrong please try again after some time",
            status: "error"
        });
    }
}

module.exports.apy = async function (req, res) {
    try {
        let data = await APYDATA.find({ Crop: req.params.Crop, District: req.params.District }).sort({ Year: 1 });

        let years =[2016,2017,2018,2019,2020,2021]

        let highest_area = []
        let highest_prod = []
        let highest_yield = []
        for(let i =0 ;i<years.length;i++)
        {
            // p["Year"]  = years[i]
            let y = await APYDATA.find({Year : years[i] ,Crop: req.params.Crop}).sort({Yield : 1});
            let p = await APYDATA.find({Year : years[i] ,Crop: req.params.Crop}).sort({Prod : 1});
            let a = await APYDATA.find({Year : years[i] ,Crop: req.params.Crop}).sort({Area : 1});
            // console.log(d[d.length-1]);
            highest_yield.push(y[y.length-1]);
            highest_prod.push(p[p.length-1]);
            highest_area.push(a[a.length-1]);

        }
        
        return res.json({data,highest_area,highest_prod,highest_yield});

    }
    catch (err) {
        console.log(err);
        return res.json({
            error: "Something went wrong please try again after some time",
            status: "error"
        });
    }
}

module.exports.district_soil = function (req, res) {
    try {
        district_wise_soil.findOne({ District: req.params.District }, function (err, data) {
            if (err) {
                console.log(err);
                return res.json({
                    error: "Something went wrong please try again after some time",
                    status: "error"
                });
            }
            else {
                return res.json(data);
            }
        });
    }
    catch (err) {
        console.log(err);
        return res.json({
            error: "Something went wrong please try again after some time",
            status: "error"
        });
    }
}