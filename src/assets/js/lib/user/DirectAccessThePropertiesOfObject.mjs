/*
	ドットつなぎのプロパティへのアクセス(https://qiita.com/exabugs/items/e3cc79b69ddeb6856d3e)
*/
export class DirectAccessThePropertiesOfObject {
	constructor() {
		//
	}

	getValue(obj, key, val) {
		return this._getValue(obj, key, val);
	}

	getValues(obj, key) {
		return this._getValues(obj, key);
	}

	setValue(obj, key, val) {
		return this._setValue(obj, key, val);
	}

	hasValue(obj, key) {
		return this._hasValue(obj, key);
	}

	delValue(obj, key) {
		return this._delValue(obj, key);
	}

	/**
	 * @desc   obj[key] 取得
	 * @param  {Object} obj アクセスされるオブジェクト
	 * @param  {String} key アクセスするプロパティを表す文字列
	 * @param  {Any} [val=undefined] プロパティが存在しなかった場合の返り値
	 * @return {Any} プロパティが存在した場合はその値を、無ければ<code>val</code>の値
	 */
	_getValue (obj, key, val) {
		return this._getObject(obj, key, function (obj, key) {
			obj = obj[0];
			if (obj === undefined) {
				return val;
			} else if (obj === null) {
				return val;
			} else if (obj[key] === undefined) {
				return val;
			} else {
				return obj[key];
			}
		}, true);
	}

	/**
	 * @desc   obj[key] 取得
	 * @param  {Object} obj アクセスされるオブジェクト
	 * @param  {String} key アクセスするプロパティを表す文字列
	 * @return {Any} プロパティが存在した場合はその値
	 */
	_getValues(obj, key) {
		return this._getObject(obj, key, function (obj, key) {
			return obj.reduce(function (ary, v) {
				v[key] !== undefined && ary.push(v[key]);
				return ary;
			}, []);
		}, true);
	}

	/**
	 * @desc   obj[key] 設定
	 * @param  {Object} obj アクセスされるオブジェクト
	 * @param  {String} key アクセスするプロパティを表す文字列
	 * @param  {Any} val セットする値
	 * @return {Boolean} プロパティを設定したかどうか？
	 */
	_setValue(obj, key, val) {
		return this._getObject(obj, key, function (obj, key) {
			return obj.reduce(function (memo, obj) {
				return obj && (obj[key] = val);
			}, false);
		}, false);
	}

	/**
	 * @desc   obj[key] 確認
	 * @param  {Object} obj アクセスされるオブジェクト
	 * @param  {String} key アクセスするプロパティを表す文字列
	 * @return {Boolean} プロパティが存在するかどうか？
	 */
	_hasValue(obj, key) {
		return this._getObject(obj, key, function (obj, key) {
			return obj.reduce(function (memo, obj) {
				return memo || key in obj;
			}, false);
		}, true);
	}

	/**
	 * @desc   obj[key] 削除
	 * @param  {Object} obj アクセスされるオブジェクト
	 * @param  {String} key アクセスするプロパティを表す文字列
	 * @return {Boolean} プロパティを削除できたか？
	 */
	_delValue(obj, key) {
		return this._getObject(obj, key, function (obj, key) {
			return obj.reduce(function (memo, obj) {
				return memo || delete obj[key];
			}, false);
		}, true);
	}

	/**
	 * @desc    obj[key]にアクセスできるように
	 * @param   obj
	 * @param   key
	 * @param   callback
	 * @param   readonly
	 * @returns {*}
	 */
	_getObject(obj, key, callback, readonly) {
		let keys = key.split(".");
		let k = keys.pop();

		if (obj === undefined || obj === null) {
			obj = [];
		} else if (!(obj instanceof Array)) {
			obj = [obj];
		}

		obj = keys.reduce(function (obj, key) {
			return obj.reduce(function (ary, obj) {
				if (obj[key] !== undefined) {
					ary = ary.concat(obj[key]);
				} else if (!readonly) {
					obj[key] = {};
					ary.push(obj[key]);
				}
				return ary;
			}, []);
		}, obj);

		return callback(obj, k);
	}
}