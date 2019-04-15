# -*- coding: utf-8 -*-
import KBEngine
import random
import time
import re
import const
import copy
from datetime import datetime, timedelta

import math
from KBEDebug import *
import hashlib
import AsyncRequest
import json
import switch
import x42

MELD_HISTORY = {}

def meld_with_pair_need_num(tiles, history=MELD_HISTORY):
	"""
	这个函数是赖子牌判断中最底层的函数, 尽量保证把万条筒中发白等分类出来(即保证清一色), 在扔到这里计算, 能够大幅提高效率
	:param tiles: 某个类型的牌, 比如清一色的万
	:param history: cache
	:return: 构成带将整扑所需要的赖子个数
	"""
	case1 = case2 = 999
	if meld_only_need_num(tiles, history) == 0:
		case1 = 2

	for i in tiles:
		tmp = list(tiles)
		if tiles.count(i) == 1:
			tmp.remove(i)
			case2 = min(case2, 1 + meld_only_need_num(tmp, history))
		else:
			tmp.remove(i)
			tmp.remove(i)
			case2 = min(case2, meld_only_need_num(tmp, history))

	return min(case1, case2)

def meld_only_need_num(tiles, history=MELD_HISTORY, used=0):
	"""
	这个函数是赖子牌判断中最底层的函数, 尽量保证把万条筒中发白等分类出来(即保证清一色), 在扔到这里计算, 能够大幅提高效率
	:param tiles: 某个类型的牌, 比如清一色的万
	:param history: cache
	:used: 已经使用的赖子个数
	:return: 构成带将整扑所需要的赖子个数
	"""
	if used > 4:
		return 999
	tiles = sorted(tiles)
	key = tuple(tiles)
	if key in history.keys():
		return history[key]

	size = len(tiles)
	if size == 0:
		return 0
	if size == 1:
		return 2
	if size == 2:
		p1, p2 = tiles[:2]
		case1 = 999
		if p1 < const.BOUNDARY and p2 - p1 <= 2:
			case1 = 1
		case2 = 0
		if p1 == p2:
			case2 = 1
		else:
			case2 = 4
		return min(case1, case2)

	first = tiles[0]
	# 自己组成顺子
	left1 = list(tiles[1:])
	case1 = 0
	if first >= const.BOUNDARY:
		case1 = 999
	else:
		if first+1 in left1:
			left1.remove(first+1)
		else:
			case1 += 1
		if first+2 in left1:
			left1.remove(first+2)
		else:
			case1 += 1
		res1 = meld_only_need_num(left1, history)
		history[tuple(left1)] = res1
		case1 += res1

	# 自己组成刻子
	left2 = list(tiles[1:])
	case2 = 0
	count = left2.count(first)
	if count >= 2:
		left2.remove(first)
		left2.remove(first)
	elif count == 1:
		left2.remove(first)
		case2 += 1
	else:
		case2 += 2
	res2 = meld_only_need_num(left2, history)
	history[tuple(left2)] = res2
	case2 += res2
	result = min(case1, case2)
	history[tuple(tiles)] = result
	return result

def getMeldNeed(handTilesButPairKing):
	"""
	得到除掉一对后手牌不含赖子牌之外的其他牌要凑成整扑(3*X)需要的赖子牌数
	:param handTiles: 手牌
	:return:
	"""
	tileList = classifyTiles(handTilesButPairKing)
	tileList.pop(0)
	return sum(meld_only_need_num(t) for t in tileList)

def is_same_day(ts1, ts2):
	d1 = datetime.fromtimestamp(ts1)
	d2 = datetime.fromtimestamp(ts2)

	if (d1.year, d1.month, d1.day) == (d2.year, d2.month, d2.day):
		return True
	return False

def gen_uid(count):
	id_s = str(count)
	size = len(id_s)
	ran_num = pow(10, max(6 - size, 0))
	ran_fix = str(random.randint(ran_num, 10 * ran_num - 1))
	return int(ran_fix + id_s)

def gen_club_id(count):
	id_s = str(count)
	size = len(id_s)
	if size < 5:
		for i in range(1000):
			ran_num = pow(10, max(4 - size, 0))
			ran_fix = str(random.randint(ran_num, 10 * ran_num - 1))
			cid = int(ran_fix + id_s)
			if cid not in x42.ClubStub.clubs:
				return cid
	else:
		return count

def gen_room_id():
	if switch.DEBUG_BASE == 1:
		return 99999
	randomId = random.randint(10000, 99999)
	for i in range(89999):
		val = randomId + i
		if val > 99999:
			val = val%100000 + 10000
		if val not in KBEngine.globalData["GameWorld"].rooms:
			return val
	return 99999

def filter_emoji(nickname):
	try:
		# UCS-4
		highpoints = re.compile(u'[\U00010000-\U0010ffff]')
	except re.error:
		# UCS-2
		highpoints = re.compile(u'[\uD800-\uDBFF][\uDC00-\uDFFF]')
	nickname = highpoints.sub(u'', nickname)
	return nickname

def classifyTiles(tiles, kingTiles=None):
	kingTiles = kingTiles or []
	kings = []
	chars = []
	bambs = []
	dots = []
	winds = []
	dragons = []

	tiles = sorted(tiles)
	for t in tiles:
		if t in kingTiles:
			kings.append(t)
		elif t in const.CHARACTER:
			chars.append(t)
		elif t in const.BAMBOO:
			bambs.append(t)
		elif t in const.DOT:
			dots.append(t)
		elif t in const.WINDS:
			winds.append(t)
		elif t in const.DRAGONS:
			dragons.append(t)
	return [kings, chars, bambs, dots, winds, dragons]

def classifyKingTiles(tiles, kingTiles):
	kings = [t for t in tiles if t in kingTiles]
	others= [t for t in tiles if t not in kingTiles]
	return kings, others

def getTile2NumDict(tiles):
	tile2NumDict = {}
	for t in tiles:
		tile2NumDict[t] = tile2NumDict.get(t, 0) + 1
	return tile2NumDict

def get_md5(data):
	m = hashlib.md5()
	m.update(data.encode())
	return m.hexdigest()

# 发送网络请求
def get_user_info(accountName, callback):
	ts = int(time.mktime(datetime.now().timetuple()))
	tosign = accountName + "_" + str(ts) + "_" + switch.PHP_SERVER_SECRET
	m1 = hashlib.md5()
	m1.update(tosign.encode())
	sign = m1.hexdigest()
	url = switch.PHP_SERVER_URL + 'user_info_server'
	suffix = '?timestamp=' + str(ts) + '&unionid=' + accountName + '&sign=' + sign
	AsyncRequest.Request(url + suffix, lambda x: callback(x))

def get_is_proxy(accountName, callback):
	ts = get_cur_timestamp()
	to_sign = accountName + "_" + str(ts) + "_" + switch.PHP_SERVER_SECRET
	sign = get_md5(to_sign)
	url = switch.PHP_SERVER_URL + 'is_proxy'
	suffix = '?timestamp=' + str(ts) + '&unionid=' + accountName + '&sign=' + sign
	AsyncRequest.Request(url + suffix, lambda x: callback(x))

def update_card_diamond(accountName, deltaCard, deltaDiamond, callback, reason = ""):
	ts = get_cur_timestamp()
	to_sign = accountName + "_" + str(ts) + "_" + str(deltaCard) + "_" + str(deltaDiamond) + "_" + switch.PHP_SERVER_SECRET
	# DEBUG_MSG("to sign::" + to_sign)
	sign = get_md5(to_sign)
	# DEBUG_MSG("MD5::" + sign)
	url = switch.PHP_SERVER_URL + 'update_card_diamond'
	data = {
		"timestamp" : ts,
		"delta_card" : deltaCard,
		"delta_diamond" : deltaDiamond,
		"unionid" : accountName,
		"sign" : sign,
		"reason" : reason
	}
	AsyncRequest.Post(url, data, lambda x: callback(x))

def update_card_diamond_aa(accountList, deltaCard, deltaDiamond, callback, reason=""):
	ts = get_cur_timestamp()
	account_json = json.dumps(accountList)
	to_sign = account_json + "_" + str(ts) + "_" + str(deltaCard) + "_" + str(deltaDiamond) + "_" + switch.PHP_SERVER_SECRET
	# DEBUG_MSG("to sign::" + to_sign)
	sign = get_md5(to_sign)
	# DEBUG_MSG("aa MD5::" + sign)
	url = switch.PHP_SERVER_URL + 'update_card_diamond_aa'
	data = {
		"timestamp": ts,
		"delta_card": deltaCard,
		"delta_diamond": deltaDiamond,
		"unionids": account_json,
		"sign": sign,
		"reason": reason
	}
	AsyncRequest.Post(url, data, lambda x: callback(x))


def update_valid_account(accountName, callback):
	to_sign = accountName + "_" + switch.PHP_SERVER_SECRET
	# DEBUG_MSG("to sign::" + to_sign)
	sign = get_md5(to_sign)
	# DEBUG_MSG("valid MD5::" + sign)
	url = switch.PHP_SERVER_URL + 'update_valid'
	data = {
		"unionid": accountName,
		"sign": sign,
	}
	AsyncRequest.Post(url, data, lambda x: callback(x))

def update_data_statistics(ts, avatar_num, online_num, room_num, callback):
	to_sign = const.GAME_NAME + "_" + str(ts) + "_" + str(avatar_num) + "_" + str(online_num) + "_" + str(room_num) + "_"  + switch.PHP_SERVER_SECRET
	# INFO_MSG("stats to sign::" + to_sign)
	sign = get_md5(to_sign)
	# INFO_MSG("stats MD5::" + sign)
	url = switch.PHP_SERVER_URL + 'update_data_statistics'
	data = {
		"game_name": const.GAME_NAME,
		"timestamp": ts,
		"avatar_num": avatar_num,
		"online_num": online_num,
		"room_num": room_num,
		"sign": sign,
	}
	AsyncRequest.Post(url, data, lambda x: callback(x))

def update_dau(dau, callback):
	ts = get_cur_timestamp()
	to_sign = const.GAME_NAME + "_" + str(ts) + "_" + str(dau) + "_" + switch.PHP_SERVER_SECRET
	# INFO_MSG("dau to sign::" + to_sign)
	sign = get_md5(to_sign)
	# INFO_MSG("dau MD5::" + sign)
	url = switch.PHP_SERVER_URL + 'update_dau'
	data = {
		"game_name": const.GAME_NAME,
		"timestamp": ts,
		"num": dau,
		"sign": sign,
	}
	AsyncRequest.Post(url, data, lambda x: callback(x))


def get_cur_timestamp():
	return int(time.time())

# 获取测试模式 初始信息
def getDebugPrefab(owner, callback):
	ts = int(time.mktime(datetime.now().timetuple()))
	url = '{}?timestamp={}&from=py&game={}&owner={}'.format(switch.PHP_DEBUG_URL, ts, const.DEBUG_JSON_NAME, owner)
	AsyncRequest.Request(url, lambda x: callback(x))

def validTile(t):
	return any(t in tiles for tiles in const.VALID_TILES)

def getCanWinTiles(handTiles):
	result = []
	if (len(handTiles) % 3 != 1):
		return result

	tryTuple = (const.CHARACTER, const.BAMBOO, const.DOT, const.WINDS, const.DRAGONS)
	for tup in tryTuple:
		for t in tup:
			tmp = list(handTiles)
			tmp.append(t)
			sorted(tmp)
			if canWinWithoutKing3N2(tmp):
				result.append(t)

	return result

def isWinTile(handTiles, kingTiles):
	length = len(handTiles)
	if length % 3 != 2:
		return False

	handCopyTiles = list(handTiles)
	handCopyTiles = sorted(handCopyTiles)
	classifyList = classifyTiles(handCopyTiles, kingTiles)
	kingTilesNum = len(classifyList[0])  # 百搭的数量
	handTilesButKing = []  # 除百搭外的手牌
	for i in range(1, len(classifyList)):
		handTilesButKing.extend(classifyList[i])

	is7Pair, _, _ = checkIs7Pair(handCopyTiles, handTilesButKing, kingTilesNum + 1, kingTiles, kingTiles[0])
	if is7Pair:
		return True
	normalWin = canWinWithKing3N2(handCopyTiles, kingTiles)
	return normalWin

def winWith3N2NeedKing(handTilesButKing):
	"""
	Attention: 正常的胡牌(3N + 2), 七对胡那种需要特殊判断, 这里不处理，这里也不判断张数
	:param handTilesButKing: 除癞子牌外手牌
	:return: num #需要癞子牌数量
	"""
	_, chars, bambs, dots, winds, dragons = classifyTiles(handTilesButKing)
	meld_list = [chars, bambs, dots, winds, dragons]
	meld_need = []
	mos = mps = 0
	for tiles in meld_list:
		mo = meld_only_need_num(tiles)
		mp = meld_with_pair_need_num(tiles)
		mos += mo
		mps += mp
		meld_need.append((mo,mp))

	need_list = []
	for mo, mp in meld_need:
		need_list.append(mp + (mos - mo))
	return min(need_list)

def winWith3NNeedKing(handTilesButKing):
	"""
	Attention: 正常的胡牌(3N), 七对胡那种需要特殊判断, 这里不处理，这里也不判断张数
	:param handTilesButKing: 除癞子外牌
	:return: num #需要癞子牌数量
	"""
	_, chars, bambs, dots, winds, dragons = classifyTiles(handTilesButKing)
	meld_list = [chars, bambs, dots, winds, dragons]
	return sum([meld_only_need_num(tiles) for tiles in meld_list])

def canWinWithKing3N2(handTiles, kingTiles):
	"""
	Attention: 正常的胡牌(3N + 2, 有赖子牌), 七对胡那种需要特殊判断, 这里不处理
	:param handTiles: 手牌
	:param kingTiles: 赖子牌列表
	:return: True or False
	"""
	if len(handTiles) % 3 != 2:
		return False

	kings, chars, bambs, dots, winds, dragons = classifyTiles(handTiles, kingTiles)
	kingTilesNum = len(kings)
	others = [chars, bambs, dots, winds, dragons]
	meld_need = []
	mos = mps = 0
	for tiles in others:
		mo = meld_only_need_num(tiles)
		mp = meld_with_pair_need_num(tiles)
		mos += mo
		mps += mp
		meld_need.append((mo, mp))

	for mo, mp in meld_need:
		if mp + (mos - mo) <= kingTilesNum:
			return True
	return False

def canWinWithoutKing3N2(handTiles):
	"""
	Attention: 正常的的胡牌(3N + 2, 没有赖子), 七对胡那种需要特殊判断, 这里不处理
	:param handTiles: 手牌
	:return: True or False
	"""
	if (len(handTiles) % 3 != 2):
		return False

	_, chars, bambs, dots, winds, dragons = classifyTiles(handTiles)
	hasPair = False

	for w in const.WINDS:
		n = winds.count(w)
		if n == 1:
			return False
		elif n == 2:
			if hasPair:
				return False
			hasPair = True
		else:
			continue

	for d in const.DRAGONS:
		n = dragons.count(d)
		if n == 1:
			return False
		elif n == 2:
			if hasPair:
				return False
			hasPair = True
		else:
			continue

	tiles = chars + bambs + dots
	if (hasPair):
		return isMeld(tiles)
	else:
		return isMeldWithPair(tiles)


def isMeld(tiles):
	if (len(tiles) % 3 != 0):
		return False

	tilesCopy = sorted(tiles)
	total = sum(tiles)
	magic = total % 3
	if magic == 0:
		while (len(tilesCopy) >= 3):
			left = tilesCopy[0]
			n = tilesCopy.count(left)
			tilesCopy.remove(left)
			if n == 1:
				# 移除一个顺子
				if left + 1 in tilesCopy:
					tilesCopy.remove(left + 1)
				else:
					return False
				if left + 2 in tilesCopy:
					tilesCopy.remove(left + 2)
				else:
					return False
			elif n == 2:
				# 移除两个顺子
				tilesCopy.remove(left)
				if tilesCopy.count(left + 1) >= 2:
					tilesCopy.remove(left + 1)
					tilesCopy.remove(left + 1)
				else:
					return False
				if tilesCopy.count(left + 2) >= 2:
					tilesCopy.remove(left + 2)
					tilesCopy.remove(left + 2)
				else:
					return False
			else:
				# 移除一个刻子
				tilesCopy.remove(left)
				tilesCopy.remove(left)

	return len(tilesCopy) == 0


def isMeldWithPair(tiles):
	if (len(tiles) % 3 != 2):
		return False

	total = sum(tiles)
	magic = total % 3
	if magic == 0:
		possible = [3, 6, 9, 33, 36, 39, 51, 54, 57]
		return checkMeldInPossible(tiles, possible)
	elif magic == 1:
		possible = [2, 5, 8, 32, 35, 38, 53, 56, 59]
		return checkMeldInPossible(tiles, possible)
	elif magic == 2:
		possible = [1, 4, 7, 31, 34, 37, 52, 55, 58]
		return checkMeldInPossible(tiles, possible)
	return False


def checkMeldInPossible(tiles, possibleList):
	for i in possibleList:
		if tiles.count(i) >= 2:
			tmp = list(tiles)
			tmp.remove(i)
			tmp.remove(i)
			if isMeld(tmp):
				return True
	return False

"""杭州麻将相关 算法"""

def checkIs7Pair(handTiles, handTilesButKing, kingTilesNum, kingTiles, finalTile): #return 7对，暴头，杠数
	if len(handTiles) != 14:
		return False, False, 0
	needNum = 0
	tileDict = getTile2NumDict(handTilesButKing)
	meld_list = []
	for tile in tileDict:
		meld_list.append([tile] * tileDict[tile])
	for meld in meld_list:
		if len(meld) % 2 != 0:
			meld.append(-1)
			needNum += 1
	if needNum > kingTilesNum:
		return False, False, 0
	# 暴头
	isBaoTou = False
	if kingTilesNum > 0:
		if finalTile in kingTiles: #最后一张是财神 必须 财神凑成对子
			isBaoTou = kingTilesNum - needNum >= 2
		else:
			isBaoTou = any(finalTile in meld and -1 in meld for meld in meld_list) or kingTilesNum - needNum >= 2
	# 全部配对后，剩余必然是偶数
	# restKingPairNum = int((kingTilesNum - needNum)/2)
	# pairNum = sum([1 for meld in meld_list if len(meld) == 2])
	# kongPairNum = sum([1 for meld in meld_list if len(meld) == 4])
	#
	# return True, isBaoTou, kongPairNum + min(restKingPairNum, pairNum)
	return True, isBaoTou, sum([1 for tile in tileDict if tileDict[tile] == 4])

# 乱风
def isAllWindsDragons(handTilesButKing, upTiles):
	up_list = []
	list(map(lambda x:up_list.extend(x), upTiles))
	return all(t in const.WINDS_DRAGONS for t in handTilesButKing) and all(t in const.WINDS_DRAGONS for t in up_list)

# 十三不搭
def isThirteenNotMatch(handCopyTiles, kingTiles): # 0 非十三不搭 1 非正规非7字 2 非正规7字 3 正规非7字 4 正规7字
	if len(handCopyTiles) != 14:
		return const.NOT_MATCH
	kings, chars, bambs, dots, winds, dragons = classifyTiles(handCopyTiles, kingTiles)

	def filter_cbd(tiles): # 0 非十三不搭 1 不正规 2 正规
		if len(tiles) <= 1:
			return 2
		# 张数满足 并且 不重叠
		if len(tiles) > 3 or any(tiles.count(t) != 1 for t in tiles):
			return 0
		# 正规(优先判断)
		if all(t%10 in [1,4,7] for t in tiles) or all(t%10 in [2,5,8] for t in tiles) or all(t%10 in [3,6,9] for t in tiles):
			return 2
		# 不正规
		sub_list_list = list(map(lambda x:[abs(t-x) for t in tiles if t != x], tiles)) # 二维数组
		min_list = [min(lis) for lis in sub_list_list]
		if min(min_list) >= 3:
			return 1
		return 0

	def filter_wd(tiles): # 0 非十三不搭 1 非7字 2 7字
		if len(tiles) < 5 or len(tiles) > 7 or any(tiles.count(t) != 1 for t in tiles):
			return 0
		if all(t in const.WINDS_DRAGONS for t in tiles):
			if len(tiles) >= len(const.WINDS_DRAGONS):
				return 2
			return 1
		return 0

	chars_mode 	= filter_cbd(chars)
	bambs_mode 	= filter_cbd(bambs)
	dots_mode 	= filter_cbd(dots)
	winds_dragons = winds[:]
	winds_dragons.extend(dragons)
	king2NumDict = getTile2NumDict(kings)
	for t in list(king2NumDict.keys()):
		if t in const.WINDS_DRAGONS:
			winds_dragons.append(t)
	winds_dragons_mode = filter_wd(winds_dragons)
	if chars_mode > 0 and bambs_mode > 0 and dots_mode > 0 and winds_dragons_mode > 0:
		# 正不正规 看 万条筒
		if chars_mode == 2 and bambs_mode == 2 and dots_mode == 2: # 正规
			if winds_dragons_mode == 2:
				return const.MATCH_STANDARD_7STAR
			else:
				return const.MATCH_STANDARD
		else:
			if winds_dragons_mode == 2:
				return const.MATCH_NOT_STANDARD_7STAR
			else:
				return const.MATCH_NOT_STANDARD
	return const.NOT_MATCH

# 万条筒 清一色
def isAllSameCBDSuit(handTilesButKing, upTiles):
	all_tile_list = []
	list(map(lambda x: all_tile_list.extend(x), upTiles))
	all_tile_list.extend(handTilesButKing)
	return all(t in const.CHARACTER for t in all_tile_list) or all(t in const.BAMBOO for t in all_tile_list) or all(t in const.DOT for t in all_tile_list)

def isAllUpMeldCBDSuit(upTiles):
	if len(upTiles) < 3:
		return False
	all_upTiles = []
	list(map(lambda x: all_upTiles.extend(x), upTiles))
	return all(t in const.CHARACTER for t in all_upTiles) or all(t in const.BAMBOO for t in all_upTiles) or all(t in const.DOT for t in all_upTiles)

# 碰碰胡 3N2
def isPongPongWin3N2(handTilesButKing, kingTilesNum, upTiles):
	if len(handTilesButKing) <= 0:
		return all(meld[0] == meld[-1] for meld in upTiles)
	tile2NumDict = getTile2NumDict(handTilesButKing)
	# 全部组成3N需要的数量
	n3Need = sum([(3 - tile2NumDict[tile]%3)%3 for tile in tile2NumDict])
	# 组成 3N2 需要的数量
	needNum =  n3Need - 1 if n3Need > 0 else 2
	return all(meld[0] == meld[-1] for meld in upTiles) and needNum <= kingTilesNum

# 碰碰胡 3N
def isPongPongWin3N(handTiles3NButKing, kingTilesNum, upTiles):
	if len(handTiles3NButKing) <= 0:
		return all(meld[0] == meld[-1] for meld in upTiles)
	tile2NumDict = getTile2NumDict(handTiles3NButKing)
	# 全部组成3N需要的数量
	n3Need = sum([(3 - tile2NumDict[tile]%3)%3 for tile in tile2NumDict])
	return all(meld[0] == meld[-1] for meld in upTiles) and n3Need <= kingTilesNum

# 连续 杠 和 飘 的次数
def serialKingKong(op_record, kingTiles):
	op_list = []
	for op,tile_list,fromIdx in reversed(op_record):
		if op == const.OP_DISCARD:
			if tile_list[0] in kingTiles:
				op_list.append(op)
			else:
				return reversed(op_list) # 只要出的不是财神就stop
		elif op in [const.OP_EXPOSED_KONG, const.OP_CONTINUE_KONG, const.OP_CONCEALED_KONG]:
			# 杠 飘 杠 飘 杠？
			op_list.append(op)
	return reversed(op_list)

def get_seconds_till_n_days_later(begin, day, hour=0, minute=0, second=0):
	""" 获取第几天后的几点几分几秒的delta_time """
	dt = timedelta(days=day, hours=hour - begin.hour, minutes=minute - begin.minute, seconds=second - begin.second)
	seconds = dt.total_seconds()
	seconds = 0 if seconds <= 0 else seconds
	return seconds

def getRoomParams(create_dict):
	return {
		'game_round'	: create_dict['game_round'],
		'pay_mode'		: create_dict['pay_mode'],
		'hand_prepare'	: create_dict['hand_prepare'],
		'room_type'		: create_dict['room_type'],
	}
