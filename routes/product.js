var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var dbConfig = require('../db/DBConfig');
var pool = mysql.createPool(dbConfig.mysql);

router.get('/', function(req, res, next) {
  res.send('respond with a resource.');
});

router.all('/getItemTypes', function(req, res, next) {
    var selectSql = 'SELECT * FROM ITEM_TYPES WHERE type = ?';
    pool.getConnection(function(err, connection) {
		var params = req.body || req.query || req.params;   
		if (!connection) {
			res.json({result: 'dberror'})
		}
		var queryParam = [params.type];
		if (params.uid) {
			queryParam.push(params.uid);
			selectSql += ' AND uid = ?';
		}
		if (params.exist) {
			queryParam.push(params.exist);
			selectSql += ' AND exist = ?';
		}

		selectSql += ' order by uid asc';

		connection.query(selectSql, queryParam, function(err, result, fields) {
			if (err) throw err;
			connection.release();  
			res.json(result)
       });
    });
});


router.all('/addItemTypes', function(req, res, next) {
    var params = req.body || req.query || req.params;   
	var returnResult = {};
    pool.getConnection(function(err, connection) {
		if (!connection) {
			res.json({result: 'dberror'})
		}
		var contentSql = 'insert into ITEM_TYPES SET ?';
		let queryParams = {
			name: params.name, 
			type: params.type, 
			prize: params.prize,
			memo: params.memo,
			updateTime: new Date(),
			createTime: new Date(),
		};
		connection.query(contentSql, [queryParams], function(err, result, fields) {
			if (err) throw err;
			var resultMap = {};
			resultMap['uid'] = result.insertId;
			resultMap['code'] = true;
			connection.release();
			res.json(resultMap)
       });
    });
});

router.all('/createBill', function(req, res, next) {
	var params = req.body || req.query || req.params;   
	var returnResult = {};
    pool.getConnection(function(err, connection) {
		if (!connection) {
			res.json({result: 'dberror'})
		}
		
		var contentSql = ' BILL_CONTENT SET ? ';
		if (params.reciveTime) {
			params.reciveTime = new Date(params.reciveTime);
		}else{
			params.reciveTime = null;
		}
		let queryParams = {
			titleName: params.titleName, 
			address: params.address, 
			mobile: params.mobile,
			phone: params.phone,
			name: params.name,
			prize: params.prize,
			reciveTime: params.reciveTime,
	        preMoney: params.preMoney,
	        restMoney: params.restMoney,
	        cutFlag: params.cutFlag,
	        sliceFlag: params.sliceFlag,
	        packFlag: params.packFlag,
	        operator: params.operator,
		};
		if (!params.contentId) {
			queryParams.createTime = new Date();
			contentSql = 'insert into' + contentSql;
		}else{
			contentSql = 'update' + contentSql + 'where uid = ?';
		}

		connection.query(contentSql, [queryParams, params.contentId], function(err, result, fields) {
			if (err) throw err;
			
			if (params.contentId) {
				let deleteItem = function() {
				    return new Promise(function (resovle, reject) {
				        var insertItemSql = 'delete FROM BILL_ITEM where contentId = ?';
						connection.query(insertItemSql, [params.contentId], function(err, result, fields) {
							if (err) throw err;
							resovle();
						});
				    });
				};
				let doDelete = async function () {
				    await deleteItem();
				}();
				result.insertId = params.contentId;
			}

			var insertFields = [
				'upLong', 'upTime', 'upMeter',
				'inTime', 'inMeter', 'inLong',
				'bottomLong', 'bottomTime', 'bottomMeter',
				'allLong', 'flag', 'count', 'needHead'];
			returnResult['contentId'] = result.insertId;
			var values = [];
			for(var n in params.items){
			    var _arr = [];
			    for(var m in insertFields){
					_arr.push(params.items[n][insertFields[m]]);
			    }
				_arr.push(result.insertId);
				_arr.push(params.items[n].selectTypes.join(','));
			    values.push(_arr);
			}
			insertFields.push('contentId');
			insertFields.push('selectTypes');

			var insertItemSql = 'insert into BILL_ITEM('+ insertFields.join(',') +') VALUES ?';
			connection.query(insertItemSql, [values], function(err, result, fields) {
				if (err) throw err;
				connection.release();  
				res.json(returnResult)
			});
       });
    });
});

router.all('/getBill', function(req, res, next) {
	var resultMap = {};
    pool.getConnection(function(err, connection) {
		var params = req.body || req.query || req.params;   
		if (!connection) {
			res.json({result: 'dberror'})
		}
		if (!params.uid) {
			res.json({result: 'param.error'})
		}
		var selectSql = 'SELECT * FROM BILL_CONTENT WHERE exist = 1 AND uid = ?';
		connection.query(selectSql, [params.uid], function(err, result, fields) {
			if (err) throw err;
			resultMap['billContent'] = result;
			selectSql = 'SELECT i.* FROM BILL_ITEM i inner join BILL_CONTENT b on i.contentId = b.uid ' + 
			'WHERE b.exist = 1 AND b.uid = ? order by i.uid asc';
			connection.query(selectSql, [params.uid], function(err, result, fields) {
				if (err) throw err;
				for (var i in result) {
					if (result[i].selectTypes) {
						result[i].selectTypes = result[i].selectTypes.split(',');
						for (var k in result[i].selectTypes) {
							result[i].selectTypes[k] = parseInt(result[i].selectTypes[k]);
						}
					}else{
						result[i].selectTypes = [];
					}
				}
				resultMap['items'] = result;
				resultMap['code'] = true;
				connection.release();  
				res.json(resultMap)
	        });
       });
    });
});


router.all('/deleteBill', function(req, res, next) {
	var resultMap = {};
    pool.getConnection(function(err, connection) {
		var params = req.body || req.query || req.params;   
		if (!connection) {
			res.json({result: 'dberror'})
		}
		if (!params.uid) {
			res.json({result: 'param.error'})
		}
		var selectSql = 'update BILL_CONTENT SET exist = 0 WHERE uid = ?';
		connection.query(selectSql, [params.uid], function(err, result, fields) {
			if (err) {
				console.info(err);
				resultMap['code'] = false;
			}else{
				resultMap['code'] = true;
			}
			connection.release();  
			res.json(resultMap)
       });
    });
});


router.all('/deleteItemType', function(req, res, next) {
	var resultMap = {};
    pool.getConnection(function(err, connection) {
		var params = req.body || req.query || req.params;   
		if (!connection) {
			res.json({result: 'dberror'})
		}
		if (!params.uid) {
			res.json({result: 'param.error'})
		}
		var selectSql = 'update ITEM_TYPES SET exist = 0 WHERE uid = ?';
		connection.query(selectSql, [params.uid], function(err, result, fields) {
			if (err) {
				console.info(err);
				resultMap['code'] = false;
			}else{
				resultMap['code'] = true;
			}
			connection.release();  
			res.json(resultMap)
       });
    });
});

router.all('/deleteBillPhy', function(req, res, next) {
	var resultMap = {};
    pool.getConnection(function(err, connection) {
		var params = req.body || req.query || req.params;   
		if (!connection) {
			res.json({result: 'dberror'})
		}
		if (!params.uid) {
			res.json({result: 'param.error'})
		}
		var selectSql = 'delete from BILL_CONTENT WHERE uid = ?';
		connection.query(selectSql, [params.uid], function(err, result, fields) {
			if (err) {
				console.info(err);
				resultMap['code'] = false;
			}else{
				resultMap['code'] = true;
			}
			connection.release();  
			res.json(resultMap)
       });
    });
});

router.all('/getBillList', function(req, res, next) {
	var resultMap = {};
    pool.getConnection(function(err, connection) {
		var params = req.body || req.query || req.params;   
		if (!connection) {
			res.json({result: 'dberror'})
		}

		var selectSql = 'SELECT count(0) as count FROM BILL_CONTENT WHERE exist = 1';
		var queryParams = [];
		
		connection.query(selectSql, queryParams, function(err, result, fields) {
			if (err) throw err;

			
			resultMap['count'] = result[0].count;

			selectSql = 'SELECT * FROM BILL_CONTENT WHERE exist = 1';
			selectSql += ' order by createTime desc';
			queryParams = [];

			var start = 0;
			if (params.pageTotal && params.pageSize && params.current) {
				params.current = params.current - 1;
				start = params.current * params.pageSize;
				selectSql += ' limit ?,?';
				queryParams.push(start);
				queryParams.push(params.pageSize);
			}
			
			connection.query(selectSql, queryParams, function(err, result, fields) {
				if (err) throw err;
				connection.release();  

				resultMap['code'] = true;
				resultMap['billList'] = result;

				res.json(resultMap)

	       });
        });
		
    });
});

module.exports = router;
