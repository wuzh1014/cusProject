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
    let params = req.body || req.query || req.params;
    let returnResult = {};
    pool.getConnection(function(err, connection) {
		if (!connection) {
			res.json({result: 'dberror'})
		}
		let contentSql = ' ITEM_TYPES SET ?';
		let queryParams = {
			name: params.name, 
			type: params.type, 
			prize: params.prize,
            mini: params.mini,
			memo: params.memo,
			updateTime: new Date(),
		};
        if (!params.uid) {
            queryParams.createTime = new Date();
            contentSql = 'insert into' + contentSql;
        }else{
            contentSql = 'update' + contentSql + 'where uid = ?';
        }
		connection.query(contentSql, [queryParams, params.uid], function(err, result, fields) {
			if (err) throw err;
            let resultMap = {};
            if (params.uid) {
                result.insertId = params.contentId;
            }
			resultMap['uid'] = result.insertId;
			connection.release();
			res.json(resultMap)
       });
    });
});

router.all('/createBillSimple', function(req, res, next) {
    let params = req.body || req.query || req.params;
    let returnResult = {};
    pool.getConnection(function(err, connection) {
        if (!connection) {
            res.json({result: 'dberror'})
        }

        let contentSql = ' BILL_SIMPLE SET ? ';
        if (!params.orderDetail.reciveTime) {
            params.orderDetail.reciveTime = new Date();
        }

        let queryParams = {
            titleName: params.titleName,
            orderDetail: JSON.stringify(params.orderDetail),
            prize: params.orderDetail.prize,
            memo: params.orderDetail.memo,
            items: JSON.stringify(params.items),
        };
        if (!params.contentId) {
            queryParams.createTime = new Date();
            contentSql = 'insert into' + contentSql;
        }else{
            contentSql = 'update' + contentSql + 'where contentId = ?';
        }

        connection.query(contentSql, [queryParams, params.contentId], function(err, result, fields) {
            if (err) throw err;

            if (params.contentId) {
                result.insertId = params.contentId;
            }
            returnResult.contentId = result.insertId;
            connection.release();
            res.json(returnResult)
        });
    });
});

router.all('/getBillSimple', function(req, res, next) {
	var resultMap = {};
    pool.getConnection(function(err, connection) {
		var params = req.body || req.query || req.params;   
		if (!connection) {
			res.json({result: 'dberror'})
		}
		if (!params.uid) {
			res.json({result: 'param.error'})
		}
		var selectSql = 'SELECT * FROM BILL_SIMPLE WHERE exist = 1 AND contentId = ?';
		connection.query(selectSql, [params.uid], function(err, result, fields) {
			if (err) throw err;

            resultMap['items'] = JSON.parse(result[0].items);
            resultMap['orderDetail'] = JSON.parse(result[0].orderDetail);
            resultMap['titleName'] = result[0].titleName;
            resultMap['createTime'] = new Date(result[0].createTime);

            connection.release();
            res.json(resultMap)
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

router.all('/getItemType', function(req, res, next) {
	var resultMap = {};
    pool.getConnection(function(err, connection) {
		var params = req.body || req.query || req.params;
		if (!connection) {
			res.json({result: 'dberror'})
		}
		if (!params.uid) {
			res.json({result: 'param.error'})
		}
		var selectSql = 'select * from ITEM_TYPES WHERE uid = ? and exist = 1';
		connection.query(selectSql, [params.uid], function(err, result, fields) {
			if (err) {
                console.info(err);
			}
			connection.release();
			res.json(result[0])
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
		var selectSql = 'delete from BILL_SIMPLE WHERE contentId = ?';
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

		var selectSql = 'SELECT count(0) as count FROM BILL_SIMPLE WHERE exist = 1';
		var queryParams = [];
		
		connection.query(selectSql, queryParams, function(err, result, fields) {
			if (err) throw err;
			resultMap['count'] = result[0].count;

			selectSql = 'SELECT * FROM BILL_SIMPLE WHERE exist = 1';
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
