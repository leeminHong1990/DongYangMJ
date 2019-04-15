# -*- coding: utf-8 -*-

import KBEngine
from KBEDebug import *
import utility
import const
import random

class iRoomRules(object):

	def __init__(self):
		# 房间的牌堆
		self.tiles = []
		self.meld_dict = dict()

	def swapSeat(self, swap_list):
		random.shuffle(swap_list)
		for i in range(len(swap_list)):
			self.players_list[i] = self.origin_players_list[swap_list[i]]

		for i,p in enumerate(self.players_list):
			if p is not None:
				p.idx = i

	def setPrevailingWind(self):
		#圈风
		if self.player_num != 4:
			return
		minDearerNum = min(self.dealerNumList)
		self.prevailing_wind = const.WINDS[(self.prevailing_wind + 1 - const.WIND_EAST)%len(const.WINDS)] if minDearerNum >= 1 else self.prevailing_wind
		self.dealerNumList = [0] * self.player_num if minDearerNum >= 1 else self.dealerNumList
		self.dealerNumList[self.dealer_idx] += 1

	def setPlayerWind(self):
		if self.player_num != 4:
			return
		#位风
		for i,p in enumerate(self.players_list):
			if p is not None:
				p.wind = (self.player_num + i - self.dealer_idx)%self.player_num + const.WIND_EAST

	def initTiles(self):
		# 万 条 筒
		self.tiles = list(const.CHARACTER) * 4 + list(const.BAMBOO) * 4 + list(const.DOT) * 4
		# 东 西 南 北
		self.tiles += [const.WIND_EAST, const.WIND_SOUTH, const.WIND_WEST, const.WIND_NORTH] * 4
		# 中 发 白
		self.tiles += [const.DRAGON_RED, const.DRAGON_GREEN, const.DRAGON_WHITE] * 4
		# # 春 夏 秋 冬
		# self.tiles += [const.SEASON_SPRING, const.SEASON_SUMMER, const.SEASON_AUTUMN, const.SEASON_WINTER]
		# # 梅 兰 竹 菊
		# self.tiles += [const.FLOWER_PLUM, const.FLOWER_ORCHID, const.FLOWER_BAMBOO, const.FLOWER_CHRYSANTHEMUM]
		DEBUG_MSG("{} init tiles:{}".format(self.prefixLogStr, self.tiles))
		self.shuffle_tiles()

	def shuffle_tiles(self):
		random.shuffle(self.tiles)
		DEBUG_MSG("{} shuffle tiles:{}".format(self.prefixLogStr, self.tiles))

	def deal(self, prefabHandTiles, prefabTopList):
		""" 发牌 """
		if prefabHandTiles is not None:
			for i,p in enumerate(self.players_list):
				if p is not None and len(prefabHandTiles) >= 0:
					p.tiles = prefabHandTiles[i] if len(prefabHandTiles[i]) <= const.INIT_TILE_NUMBER else prefabHandTiles[i][0:const.INIT_TILE_NUMBER]
			topList = prefabTopList if prefabTopList is not None else []
			allTiles = []
			for i, p in enumerate(self.players_list):
				if p is not None:
					allTiles.extend(p.tiles)
			allTiles.extend(topList)

			tile2NumDict = utility.getTile2NumDict(allTiles)
			warning_tiles = [t for t, num in tile2NumDict.items() if num > 4]
			if len(warning_tiles) > 0:
				WARNING_MSG("{} prefab {} is larger than 4.".format(self.prefixLogStr, warning_tiles))
			for t in allTiles:
				if t in self.tiles:
					self.tiles.remove(t)
			for i in range(const.INIT_TILE_NUMBER):
				num = 0
				for j in range(self.player_num):
					if len(self.players_list[j].tiles) >= const.INIT_TILE_NUMBER:
						continue
					self.players_list[j].tiles.append(self.tiles[num])
					num += 1
				self.tiles = self.tiles[num:]

			newTiles = topList
			newTiles.extend(self.tiles)
			self.tiles = newTiles
		else:
			for i in range(const.INIT_TILE_NUMBER):
				for j in range(self.player_num):
					self.players_list[j].tiles.append(self.tiles[j])
				self.tiles = self.tiles[self.player_num:]

		for i, p in enumerate(self.players_list):
			DEBUG_MSG("{} idx:{} deal tiles:{}".format(self.prefixLogStr, i, p.tiles))

	def kongWreath(self):
		""" 杠花 """
		for i in range(self.player_num):
			for j in range(len(self.players_list[i].tiles)-1, -1, -1):
				tile = self.players_list[i].tiles[j]
				if tile in const.SEASON or tile in const.FLOWER:
					del self.players_list[i].tiles[j]
					self.players_list[i].wreaths.append(tile)
					DEBUG_MSG("{} kong wreath, idx:{},tile:{}".format(self.prefixLogStr, i, tile))

	def addWreath(self):
		""" 补花 """
		for i in range(self.player_num):
			while len(self.players_list[i].tiles) < const.INIT_TILE_NUMBER:
				if len(self.tiles) <= 0:
					break
				tile = self.tiles[0]
				self.tiles = self.tiles[1:]
				if tile in const.SEASON or tile in const.FLOWER:
					self.players_list[i].wreaths.append(tile)
					DEBUG_MSG("{} add wreath, tile is wreath,idx:{},tile:{}".format(self.prefixLogStr, i, tile))
				else:
					self.players_list[i].tiles.append(tile)
					DEBUG_MSG("{} add wreath, tile is not wreath, idx:{},tile:{}".format(self.prefixLogStr, i, tile))

	# def rollKingTile(self):
	# 	""" 财神 """
	# 	self.kingTiles = []
	# 	if self.king_num > 0:
	# 		for i in range(len(self.tiles)):
	# 			t = self.tiles[i]
	# 			if t not in const.SEASON and t not in const.FLOWER: #第一张非花牌
	# 				# 1-9为一圈 东南西北为一圈 中发白为一圈
	# 				self.kingTiles.append(t)
	# 				if self.king_num > 1:
	# 					for tup in (const.CHARACTER, const.BAMBOO, const.DOT, const.WINDS, const.DRAGONS):
	# 						if t in tup:
	# 							index = tup.index(t)
	# 							self.kingTiles.append(tup[(index + 1)%len(tup)])
	# 							break
	# 				del self.tiles[i]
	# 				break

	# 杭州麻将特殊处理
	def rollKingTile(self, prefabKingTiles):
		""" 财神 """
		self.kingTiles = []
		if prefabKingTiles is not None and len(prefabKingTiles) > 0:
			if self.king_mode == 0:  # 财神模式 固定白板
				self.kingTiles.append(const.DRAGON_WHITE)
			else:
				self.kingTiles.append(prefabKingTiles[0])
				for t in self.kingTiles:
					if t in self.tiles:
						self.tiles.remove(t)
		else:
			if self.king_num > 0:
				if self.king_mode == 0: # 财神模式 固定白板
					self.kingTiles.append(const.DRAGON_WHITE)
				else:
					for i in range(len(self.tiles)):
						t = self.tiles[i]
						if t not in const.SEASON and t not in const.FLOWER: #第一张非花牌
							# 1-9为一圈 东南西北为一圈 中发白为一圈
							self.kingTiles.append(t)
							if self.king_num > 1:
								for tup in (const.CHARACTER, const.BAMBOO, const.DOT, const.WINDS, const.DRAGONS):
									if t in tup:
										index = tup.index(t)
										self.kingTiles.append(tup[(index + 1)%len(tup)])
										break
							del self.tiles[i]
							break

	def tidy(self):
		""" 整理 """
		for i in range(self.player_num):
			self.players_list[i].tidy(self.kingTiles)

	def throwDice(self, idxList):
		diceList = [[0,0] for i in range(self.player_num)]
		for i in range(len(diceList)):
			if i in idxList:
				diceList[i][0] = random.randint(1, 6)
				diceList[i][1] = random.randint(1, 6)
		return diceList

	def getMaxDiceIdx(self, diceList):
		numList = [v[0] + v[1] for v in diceList]
		maxVal, maxIdx = max(numList), self.dealer_idx
		for i in range(self.dealer_idx, self.dealer_idx + self.player_num):
			idx = i%self.player_num
			if numList[idx] == maxVal:
				maxIdx = idx
				break
		return maxIdx, maxVal

	def drawLuckyTile(self):
		return []
		# luckyTileList = []
		# for i in range(self.lucky_num):
		# 	if len(self.tiles) > 0:
		# 		luckyTileList.append(self.tiles[0])
		# 		self.tiles = self.tiles[1:]
		# return luckyTileList

	def cal_lucky_tile_score(self, lucky_tiles, winIdx):
		pass

	def swapTileToTop(self, tile):
		if tile in self.tiles:
			tileIdx = self.tiles.index(tile)
			self.tiles[0], self.tiles[tileIdx] = self.tiles[tileIdx], self.tiles[0]

	def winCount(self):
		pass

	def canTenPai(self, handTiles):
		length = len(handTiles)
		if length % 3 != 1:
			return False

		result = []
		tryTuple = (const.CHARACTER, const.BAMBOO, const.DOT, const.WINDS, const.DRAGONS)
		for tup in tryTuple:
			for t in tup:
				tmp = list(handTiles)
				tmp.append(t)
				sorted(tmp)
				if utility.isWinTile(tmp, self.kingTiles):
					result.append(t)
		return result != []

	def is_op_kingTile_limit(self, idx):
		"""打财神后操作限制"""
		if self.discard_king_idx >= 0 and self.discard_king_idx != idx:
			return True
		return False

	def can_cut_after_kong(self):
		return False

	def can_discard(self, idx, t):
		return True

	def can_chow(self, idx, t):
		if self.is_op_kingTile_limit(idx):
			return False
		if t in self.kingTiles:
			return False
		if t >= const.BOUNDARY:
			return False
		tiles = list(filter(lambda x:x not in self.kingTiles, self.players_list[idx].tiles))
		MATCH = ((-2, -1), (-1, 1), (1, 2))
		for tup in MATCH:
			if all(val+t in tiles for val in tup):
				return True
		return False

	def can_chow_list(self, idx, tile_list):
		if self.is_op_kingTile_limit(idx):
			return False
		# """ 能吃 """
		if len(tile_list) != 3:
			return False
		if any(t in self.kingTiles for t in tile_list):
			return False
		if any(t >= const.BOUNDARY for t in tile_list):
			return False
		tiles 	= list(filter(lambda x: x not in self.kingTiles, self.players_list[idx].tiles))
		if tile_list[1] in tiles and tile_list[2] in tiles:
			sortLis = sorted(list(tile_list))
			if (sortLis[2] + sortLis[0])/2 == sortLis[1] and sortLis[2] - sortLis[0] == 2:
				return True
		return False

	def can_pong(self, idx, t):
		if self.is_op_kingTile_limit(idx):
			return False
		""" 能碰 """
		tiles = self.players_list[idx].tiles
		if t in self.kingTiles:
			return False
		return sum([1 for i in tiles if i == t]) >= 2

	def can_exposed_kong(self, idx, t):
		if self.is_op_kingTile_limit(idx):
			return False
		""" 能明杠 """
		if t in self.kingTiles:
			return False
		tiles = self.players_list[idx].tiles
		return tiles.count(t) == 3

	def can_continue_kong(self, idx, t):
		""" 能够补杠 """
		if t in self.kingTiles:
			return False
		player = self.players_list[idx]
		for op in player.op_r:
			if op[0] == const.OP_PONG and op[1][0] == t:
				return True
		return False

	def can_concealed_kong(self, idx, t):
		""" 能暗杠 """
		if t in self.kingTiles:
			return False
		tiles = self.players_list[idx].tiles
		return tiles.count(t) == 4

	def can_kong_wreath(self, tiles, t):
		if t in tiles and (t in const.SEASON or t in const.FLOWER):
			return True
		return False

	def can_wreath_win(self, wreaths):
		if len(wreaths) == len(const.SEASON) + len(const.FLOWER):
			return True
		return False

	def follow_dealer(self, idx, tile):
		if not self.follow_flag:
			return
		if len(self.follow_list) <= 0:
			self.follow_list.append((idx, tile))
		elif idx == (self.follow_list[-1][0] + 1) % self.player_num and (len(self.follow_list)%4 == 0 or self.follow_list[-1][1] == tile):
			self.follow_list.append((idx, tile))
			if len(self.follow_list)%4 == 0:
				self.cal_follow_score(self.dealer_idx, 2 ** int(len(self.follow_list)/4 - 1))
		else:
			self.follow_flag = False


	def getNotifyOpList(self, idx, aid, tile):
		# notifyOpList 和 self.wait_op_info_list 必须同时操作
		# 数据结构：问询玩家，操作玩家，牌，操作类型，得分，结果，状态
		notifyOpList = [[] for i in range(self.player_num)]
		self.wait_op_info_list = []
		#胡
		if aid == const.OP_KONG_WREATH and self.can_wreath_win(self.players_list[idx].wreaths): # 8花胡
			opDict = {"idx":idx, "from":idx, "tileList":[tile,], "aid":const.OP_WREATH_WIN, "score":0, "result":[], "state":const.OP_STATE_WAIT}
			notifyOpList[idx].append(opDict)
			self.wait_op_info_list.append(opDict)
		elif aid == const.OP_EXPOSED_KONG: #直杠 抢杠胡
			wait_for_win_list = self.getKongWinList(idx, tile)
			self.wait_op_info_list.extend(wait_for_win_list)
			for i in range(len(wait_for_win_list)):
				dic = wait_for_win_list[i]
				notifyOpList[dic["idx"]].append(dic)
		elif aid == const.OP_CONTINUE_KONG: #碰后接杠 抢杠胡
			wait_for_win_list = self.getKongWinList(idx, tile)
			self.wait_op_info_list.extend(wait_for_win_list)
			for i in range(len(wait_for_win_list)):
				dic = wait_for_win_list[i]
				notifyOpList[dic["idx"]].append(dic)
		elif aid == const.OP_CONCEALED_KONG:
			pass
		elif aid == const.OP_DISCARD:
			#胡(放炮胡)
			wait_for_win_list = self.getGiveWinList(idx, tile)
			self.wait_op_info_list.extend(wait_for_win_list)
			for i in range(len(wait_for_win_list)):
				dic = wait_for_win_list[i]
				notifyOpList[dic["idx"]].append(dic)
			#杠 碰
			for i, p in enumerate(self.players_list):
				if p and i != idx:
					if self.can_exposed_kong(i, tile):
						opDict = {"idx":i, "from":idx, "tileList":[tile,], "aid":const.OP_EXPOSED_KONG, "score":0, "result":[], "state":const.OP_STATE_WAIT}
						self.wait_op_info_list.append(opDict)
						notifyOpList[i].append(opDict)
					if self.can_pong(i, tile):
						opDict = {"idx":i, "from":idx, "tileList":[tile,], "aid":const.OP_PONG, "score":0, "result":[], "state":const.OP_STATE_WAIT}
						self.wait_op_info_list.append(opDict)
						notifyOpList[i].append(opDict)
			#吃
			nextIdx = self.nextIdx
			if self.can_chow(nextIdx, tile):
				opDict = {"idx":nextIdx, "from":idx, "tileList":[tile,], "aid":const.OP_CHOW, "score":0, "result":[], "state":const.OP_STATE_WAIT}
				self.wait_op_info_list.append(opDict)
				notifyOpList[nextIdx].append(opDict)
		return notifyOpList


	# 抢杠胡 玩家列表
	def getKongWinList(self, idx, tile):
		wait_for_win_list = []
		for i in range(self.player_num - 1):
			ask_idx = (idx+i+1)%self.player_num
			p = self.players_list[ask_idx]
			tryTiles = list(p.tiles)
			tryTiles.append(tile)
			tryTiles = sorted(tryTiles)
			DEBUG_MSG("{} getKongWinList {}".format(self.prefixLogStr, ask_idx))
			is_win, score, result = self.can_win(tryTiles, tile, const.OP_KONG_WIN, ask_idx)
			if is_win:
				wait_for_win_list.append({"idx":ask_idx, "from":idx, "tileList":[tile,], "aid":const.OP_KONG_WIN, "score":score, "result":result, "state":const.OP_STATE_WAIT})
		return wait_for_win_list

	# 放炮胡 玩家列表
	def getGiveWinList(self, idx, tile):
		wait_for_win_list = []
		if tile in self.kingTiles:
			return wait_for_win_list
		for i in range(self.player_num - 1):
			ask_idx = (idx+i+1)%self.player_num
			p = self.players_list[ask_idx]
			tryTiles = list(p.tiles)
			tryTiles.append(tile)
			tryTiles = sorted(tryTiles)
			is_win, score, result = self.can_win(tryTiles, tile, const.OP_GIVE_WIN, ask_idx)
			if is_win:
				wait_for_win_list.append({"idx":ask_idx, "from":idx, "tileList":[tile,], "aid":const.OP_GIVE_WIN, "score":score, "result":result, "state":const.OP_STATE_WAIT})
		return wait_for_win_list

	def can_win(self, handTiles, finalTile, win_op, idx):
		#"""平胡 四财神 爆头 七对子 碰碰胡 清一色 乱风  清风 天胡 地胡 十三不搭 海底捞月"""
		#"""杠 + 飘"""
		is_win = False
		is_bao_tou = False
		result_list = [0] * 12
		score = 0
		DEBUG_MSG("{} {}".format(self.prefixLogStr, "****begin***"*5))
		DEBUG_MSG("{} idx:{} win_op:{} handTiles:{} upTiles:{} finalTile:{}".format(self.prefixLogStr, idx, win_op, handTiles, self.players_list[idx].upTiles, finalTile))
		if len(handTiles) % 3 != 2:
			return is_win, score, result_list
		if win_op == const.OP_WREATH_WIN:
			return False, score, result_list

		p = self.players_list[idx]
		upTiles = p.upTiles
		handCopyTiles = list(handTiles)
		handCopyTiles = sorted(handCopyTiles)
		kings, handTilesButKing = utility.classifyKingTiles(handCopyTiles, self.kingTiles)
		kingTilesNum = len(kings)
		handTilesButKing = sorted(handTilesButKing)

		def cut_list(lis, mid = 0): # 截取数组 到小于或者 大于 某个值为止
			min_list = []
			max_list = []
			for x in lis:
				if x < mid:
					min_list.append(x)
				else:
					break
			for x in lis:
				if x > mid:
					max_list.append(x)
				else:
					break
			return min_list, max_list

		def not_bao_tou_3n2(op_r, handTilesButKing, kingTilesNum, upTiles, result_list):
			sum_score = 0
			if utility.winWith3N2NeedKing(handTilesButKing) <= kingTilesNum:
				# 只有连续杠开
				kingKongList = [1 if op == const.OP_DISCARD else -1 for op in
								utility.serialKingKong(op_r, self.kingTiles)]
				# 截取全部是 -1 的数组（杠）
				min_list, _ = cut_list(kingKongList)
				sum_score += len(min_list) * 2
				result_list.extend(min_list)
				# 碰碰胡
				if utility.isPongPongWin3N2(handTilesButKing, kingTilesNum, upTiles):
					sum_score += 2
					result_list[4] = 1
				elif len(min_list) <= 0:
					result_list[0] = 1
				return True, sum_score
			return False, sum_score

		def bao_tou_3n(op_r, tryList, tryKingsNum, upTiles, result_list):
			sum_score = 0
			if utility.getMeldNeed(tryList) <= tryKingsNum:
				result_list[2] = 1
				# 连续飘杠胜利
				kingKongList = [1 if op == const.OP_DISCARD else -1 for op in
								utility.serialKingKong(op_r, self.kingTiles)]
				sum_score += (len(kingKongList) + 1) * 2
				result_list.extend(kingKongList)
				# 碰碰胡
				if utility.isPongPongWin3N(tryList, tryKingsNum, upTiles):
					sum_score += 2
					result_list[4] = 1
				return True, sum_score
			return False, sum_score

		# 十三不搭
		not_match_mode = utility.isThirteenNotMatch(handCopyTiles,self.kingTiles)
		if not_match_mode > 0:
			is_win = True
			result_list[10] = not_match_mode
			DEBUG_MSG("{} thirteenNotMatch match mode:{}".format(self.prefixLogStr, not_match_mode))
			if not_match_mode == const.MATCH_NOT_STANDARD:
				score += 1
			elif not_match_mode == const.MATCH_NOT_STANDARD_7STAR:
				score += 2
			elif not_match_mode == const.MATCH_STANDARD:
				score += 2
			else:
				score += 4
		else:
			# 可能满足7对 也满足 平胡 条件的牌
			# 2N
			is7Pair, isBaoTou, _ = utility.checkIs7Pair(handCopyTiles, handTilesButKing, kingTilesNum, self.kingTiles, finalTile)
			if is7Pair:
				score += 2
				result_list[3] = 1
				is_win = True
				DEBUG_MSG("{} 7Pair".format(self.prefixLogStr))
				if isBaoTou:
					is_bao_tou = True
					result_list[2] = 1
					# 连续 飘财
					kingKongList = [1 if op == const.OP_DISCARD else -1 for op in utility.serialKingKong(p.op_r, self.kingTiles)]
					result_list.extend(kingKongList)
					score += (len(kingKongList) + 1) * 2
					DEBUG_MSG("{} 7Pair baotou ".format(self.prefixLogStr))
			else:
				# 3N2
				if kingTilesNum <= 0:
					is_win, sum_score = not_bao_tou_3n2(p.op_r, handTilesButKing, kingTilesNum, upTiles, result_list)
					score += sum_score if is_win else 0
					DEBUG_MSG("{} 3N2 kingTilesNum <= 0 is_win:{} sum_score:{}".format(self.prefixLogStr, is_win, sum_score))
				else:
					baotou_n3_list = []
					tryKingsNum = kingTilesNum
					if finalTile in self.kingTiles:  # 最后一张 摸的是财神
						if tryKingsNum >= 2:
							tryKingsNum -= 2
							baotou_n3_list.append(list(handTilesButKing))
					else:
						tryKingsNum -= 1
						tryList = list(handTilesButKing)
						tryList.remove(finalTile)  # 若最后一张不是财神 则用代替后的牌
						baotou_n3_list.append(tryList)
					DEBUG_MSG("{} baotou_n3_list:{}".format(self.prefixLogStr, baotou_n3_list))
					# 优先尝试暴头
					for tryList in baotou_n3_list:
						is_win, sum_score = bao_tou_3n(p.op_r, tryList, tryKingsNum, upTiles, result_list)
						if is_win:
							is_bao_tou = True
							score += sum_score
							DEBUG_MSG("{} 3N baotou sum_score:{}".format(self.prefixLogStr, sum_score))
							break
					else:
						is_win, sum_score = not_bao_tou_3n2(p.op_r, handTilesButKing, kingTilesNum, upTiles, result_list)
						score += sum_score if is_win else 0
						DEBUG_MSG("{} 3N2 notbaotou is_win:{} sum_score:{}".format(self.prefixLogStr, is_win, sum_score))

			# 是否是清一色(必须是 2N 3N2 胡法 十三幺不存在清一色)
			if is_win and utility.isAllSameCBDSuit(handTilesButKing, upTiles):  # 清一色
				result_list[0] = 0
				result_list[5] = 2
				score += 10 if win_op == const.OP_GIVE_WIN else 8
				DEBUG_MSG("{} qingyise".format(self.prefixLogStr))
			elif is_win and len(self.job_relation(idx)) > 0 and utility.isAllUpMeldCBDSuit(upTiles): # 门前清 承包
				result_list[5] = 1
				score += 8 if win_op == const.OP_DRAW_WIN else 10
				DEBUG_MSG("{} menqianqing".format(self.prefixLogStr))
				if win_op == const.OP_GIVE_WIN:
					# 门前清 不能放炮胡
					return False, score, result_list
			elif utility.isAllWindsDragons(handTilesButKing, upTiles): # 全字
				result_list[0] = 0
				is_win = True
				if sum([i if i >= 0 else abs(i) for i in result_list]) > 0: # 清风
					result_list[7] = 1
					score += 20
					DEBUG_MSG("{} qingfeng".format(self.prefixLogStr))
				else:
					result_list[6] = 1 # 若不是清风 必定是乱风
					score += 10
					DEBUG_MSG("{} luanfeng".format(self.prefixLogStr))

		# 4财神 (额外)
		if kingTilesNum == 4:
			is_win = True
			result_list[1] = 4
			# score += 2
			DEBUG_MSG("{} hand king 4".format(self.prefixLogStr))
		elif is_win:
			# 连续 杠飘
			if is_bao_tou:
				kingKongList = [1 if op == const.OP_DISCARD else -1 for op in
								utility.serialKingKong(p.op_r, self.kingTiles)]
				if sum([1 for i in kingKongList if i > 0]) + kingTilesNum == 4:
					result_list[1] = 4
					# score += 2
				DEBUG_MSG("{} hand king {} allking {}".format(self.prefixLogStr, kingTilesNum, sum([1 for i in kingKongList if i > 0]) + kingTilesNum))

		# 满足胡的条件下
		if is_win:
			# 天胡
			if idx == self.dealer_idx and win_op == const.OP_DRAW_WIN and len(p.op_r) == 1:
				score += 10
				result_list[8] = 1
				result_list[0] = 0
				DEBUG_MSG("{} tianhu".format(self.prefixLogStr))
			# 地胡
			elif idx != self.dealer_idx and win_op == const.OP_GIVE_WIN and len(self.all_discard_tiles) == 1:
				score += 10
				result_list[9] = 1
				result_list[0] = 0
				DEBUG_MSG("{} dihu".format(self.prefixLogStr))
			# 海底捞月
			elif win_op == const.OP_DRAW_WIN and len(self.tiles) <= self.end_tile_num:
				score += 2
				result_list[11] = 1
				result_list[0] = 0
				DEBUG_MSG("{} haidilaoyue".format(self.prefixLogStr))

		# 如果只有 平胡 还要 算 1分
		if result_list[0] == 1 and sum([1 for i in result_list if i != 0]) == 1:
			score += 1
		# 能不能放炮 抢杠 条件筛选
		# 放炮胡 和 抢杠胡的条件是一样的， 只有大于等于2分以上的牌才可以放炮、抢杠，并且财神头不能 放炮、抢杠 除了清一色 清风 乱风 这三种财神头
		DEBUG_MSG("{} all score {}, all result_list:{}".format(self.prefixLogStr, score, result_list))
		DEBUG_MSG("{} {}".format(self.prefixLogStr, "****end***" * 5))
		if win_op == const.OP_KONG_WIN:
			score = max(2, score)
			if is_bao_tou and result_list[5] <= 0 and result_list[6] <= 0 and result_list[7] <= 0:
				return False, score, result_list

		if win_op == const.OP_GIVE_WIN:
			if score < 2:
				return False, score, result_list
			if is_bao_tou and result_list[5] <= 0 and result_list[6] <= 0 and result_list[7] <= 0:
				return False, score, result_list
		return is_win, score, result_list

	def job_relation(self, win_idx): # 承包关系
		relations = []
		# 是否有三摊承包
		if not self.three_job:
			return relations
		# 碰算摊
		include_op_list = [const.OP_CHOW, const.OP_PONG, const.OP_EXPOSED_KONG] if self.pong_useful else [const.OP_CHOW]
		for k,v in enumerate(self.players_list):
			if v is not None:
				job_dict = {}
				for record in v.op_r:
					if (record[2] == win_idx or k == win_idx) and record[2] != k and record[0] in include_op_list:
						if record[2] not in job_dict:
							job_dict.setdefault(record[2],1)
						else:
							job_dict[record[2]] += 1
				for x,y in job_dict.items():
					if y >= 3:
						relations.append([k, x]) # k 吃 x 3次
		DEBUG_MSG("{} job_relation {}".format(self.prefixLogStr, relations))
		return relations

	def cal_kong_score(self, idx, fromIdx, aid, score):
		if aid == const.OP_EXPOSED_KONG:
			sub_all = 0
			for i,p in enumerate(self.players_list):
				if i != idx:
					sub_all += p.add_kong_score(-1)
					DEBUG_MSG("{} cal_kong_score idx:{}, score:{}".format(self.prefixLogStr, i, sub_all))
			DEBUG_MSG("{} cal_kong_score idx:{}, score:{}".format(self.prefixLogStr, idx, -sub_all))
			self.players_list[idx].add_kong_score(-sub_all)
		elif aid == const.OP_CONTINUE_KONG:
			sub_all = 0
			for i, p in enumerate(self.players_list):
				if i != idx:
					sub_all += p.add_kong_score(-1)
					DEBUG_MSG("{} cal_kong_score idx:{}, score:{}".format(self.prefixLogStr, i, sub_all))
			DEBUG_MSG("{} cal_kong_score idx:{}, score:{}".format(self.prefixLogStr, idx, -sub_all))
			self.players_list[idx].add_kong_score(-sub_all)
		elif aid == const.OP_CONCEALED_KONG:
			sub_all = 0
			for i, p in enumerate(self.players_list):
				if i != idx:
					sub_all += p.add_kong_score(-2)
					DEBUG_MSG("{} cal_kong_score idx:{}, score:{}".format(self.prefixLogStr, i, sub_all))
			DEBUG_MSG("{} cal_kong_score idx:{}, score:{}".format(self.prefixLogStr, idx, -sub_all))
			self.players_list[idx].add_kong_score(-sub_all)

	def cal_follow_score(self, idx, score):
		sub_all = 0
		for i, p in enumerate(self.players_list):
			if i != idx:
				sub_all += p.add_score(score)
				DEBUG_MSG("{} sub follow score idx:{} score:{}".format(self.prefixLogStr, i, score))
		self.players_list[idx].add_score(-sub_all)
		DEBUG_MSG("{} sub follow score idx:{} score:{}".format(self.prefixLogStr, idx, -sub_all))

	def cal_win_score(self, idx, fromIdx, aid, score, result_list=[]):
		if aid == const.OP_DRAW_WIN:
			relations = self.job_relation(idx)
			if (result_list[5] > 0 or result_list[6] > 0 or result_list[7] > 0) and len(relations) > 0: # 承包、反承包
				sub_all = 0
				for x in relations:
					if x[0] == idx: # 承包
						if result_list[5] > 0:
							sub_all += self.players_list[x[1]].add_score(-20)
							DEBUG_MSG("{} cal_win_score relations idx:{}, score:{}-{}".format(self.prefixLogStr, x[1], -20, sub_all))
						elif result_list[6] > 0:
							sub_all += self.players_list[x[1]].add_score(-30)
							DEBUG_MSG("{} cal_win_score relations idx:{}, score:{}-{}".format(self.prefixLogStr, x[1], -30, sub_all))
						elif result_list[7] > 0:
							sub_all += self.players_list[x[1]].add_score(-30)
							DEBUG_MSG("{} cal_win_score relations idx:{}, score:{}-{}".format(self.prefixLogStr, x[1], -30, sub_all))
					else: # 反承包
						if result_list[5] > 0:
							sub_all += self.players_list[x[0]].add_score(-20)
							DEBUG_MSG("{} cal_win_score relations idx:{}, score:{}-{}".format(self.prefixLogStr, x[0], -20, sub_all))
						elif result_list[6] > 0:
							sub_all += self.players_list[x[0]].add_score(-30)
							DEBUG_MSG("{} cal_win_score relations idx:{}, score:{}-{}".format(self.prefixLogStr, x[0], -30, sub_all))
						elif result_list[7] > 0:
							sub_all += self.players_list[x[0]].add_score(-30)
							DEBUG_MSG("{} cal_win_score relations idx:{}, score:{}-{}".format(self.prefixLogStr, x[0], -30, sub_all))
				self.players_list[idx].add_score(-sub_all)
				DEBUG_MSG("{} cal_win_score relations idx:{}, score:{}".format(self.prefixLogStr, idx, -sub_all))
			else:
				sub_all = 0
				for i, p in enumerate(self.players_list):
					if i != idx:
						sub_all += p.add_score(-score)
						DEBUG_MSG("{} cal_draw_win_score idx:{}, score:{}-{}".format(self.prefixLogStr, i, -score, sub_all))
				self.players_list[idx].add_score(-sub_all)
				DEBUG_MSG("{} cal_draw_win_score idx:{}, score:{}".format(self.prefixLogStr, idx, -sub_all))

				# 四财神 每家 减2
				if len(result_list) and result_list[1] == 4:
					sub_all = 0
					for i, p in enumerate(self.players_list):
						if i != idx and p is not None:
							sub_all += p.add_score(-2)
							DEBUG_MSG("{} cal_draw_win_score 4kings idx:{}, score:{}-{}".format(self.prefixLogStr, i, -2, sub_all))
					self.players_list[idx].add_score(-sub_all)
					DEBUG_MSG("{} cal_draw_win_score 4kings idx:{}, score:{}".format(self.prefixLogStr, idx, -sub_all))
		elif aid == const.OP_KONG_WIN:
			relations = self.job_relation(idx)
			if (result_list[5] > 0 or result_list[6] > 0 or result_list[7] > 0) and len(relations) > 0:  # 承包、反承包
				sub_all = 0
				for x in relations:
					if x[0] == idx:  # 承包
						if result_list[5] > 0:
							sub_all += self.players_list[x[1]].add_score(-20)
							DEBUG_MSG("{} cal_kong_win_score relations idx:{}, score:{}-{}".format(self.prefixLogStr, x[1], -20,sub_all))
						elif result_list[6] > 0:
							sub_all += self.players_list[x[1]].add_score(-30)
							DEBUG_MSG("{} cal_kong_win_score relations idx:{}, score:{}-{}".format(self.prefixLogStr, x[1], -30,sub_all))
						elif result_list[7] > 0:
							sub_all += self.players_list[x[1]].add_score(-30)
							DEBUG_MSG("{} cal_kong_win_score relations idx:{}, score:{}-{}".format(self.prefixLogStr, x[1], -30,sub_all))
					else:  # 反承包
						if result_list[5] > 0:
							sub_all += self.players_list[x[0]].add_score(-20)
							DEBUG_MSG("{} cal_kong_win_score relations idx:{}, score:{}-{}".format(self.prefixLogStr, x[0], -20,sub_all))
						elif result_list[6] > 0:
							sub_all += self.players_list[x[0]].add_score(-30)
							DEBUG_MSG("{} cal_kong_win_score relations idx:{}, score:{}-{}".format(self.prefixLogStr, x[0], -30,sub_all))
						elif result_list[7] > 0:
							sub_all += self.players_list[x[0]].add_score(-30)
							DEBUG_MSG("{} cal_kong_win_score relations idx:{}, score:{}-{}".format(self.prefixLogStr, x[0], -30, sub_all))
				self.players_list[idx].add_score(-sub_all)
				DEBUG_MSG("{} cal_kong_win_score relations idx:{}, score:{}".format(self.prefixLogStr, idx, -sub_all))

				# 非承包关系玩家 放炮出一半分
				sub_all = 0
				if all(fromIdx not in x for x in relations):
					if result_list[5] > 0:
						sub_all += self.players_list[fromIdx].add_score(-10)
						DEBUG_MSG("{} cal_give_score kong_idx:{}, score:{}-{}".format(self.prefixLogStr, fromIdx, -10, sub_all))
					elif result_list[6] > 0:
						sub_all += self.players_list[fromIdx].add_score(-15)
						DEBUG_MSG("{} cal_give_score kong_idx:{}, score:{}-{}".format(self.prefixLogStr, fromIdx, -15, sub_all))
					elif result_list[7] > 0:
						sub_all += self.players_list[fromIdx].add_score(-15)
						DEBUG_MSG("{} cal_give_score kong_idx:{}, score:{}-{}".format(self.prefixLogStr, fromIdx, -15, sub_all))
				self.players_list[idx].add_score(-sub_all)
				DEBUG_MSG("{} cal_give_score win_idx:{}, score:{}".format(self.prefixLogStr, idx, -sub_all))
			else:

				self.players_list[idx].add_score(score * 3)
				self.players_list[fromIdx].add_score(-score * 3)
				DEBUG_MSG("{} cal_kong_win_score idx:{}, score:{}".format(self.prefixLogStr, idx, score * 3))
				DEBUG_MSG("{} cal_kong_win_score idx:{}, score:{}".format(self.prefixLogStr, fromIdx, -score * 3))
				# sub_all = 0
				# for i, p in enumerate(self.players_list):
				# 	if i != idx:
				# 		if i == fromIdx:
				# 			sub_all += p.add_score(-score)
				# 			DEBUG_MSG("{} cal_kong_win_score idx:{}, score:{}-{}".format(self.prefixLogStr, i, -score, sub_all))
				# 		else:
				# 			sub_all += p.add_score(int(-score / 2))
				# 			DEBUG_MSG("{} cal_kong_win_score idx:{}, score:{}-{}".format(self.prefixLogStr, i, int(-score / 2), sub_all))
				# self.players_list[idx].add_score(-sub_all)
				# DEBUG_MSG("{} cal_kong_win_score idx:{}, score:{}".format(self.prefixLogStr, idx, -sub_all))
				# 四财神 每家 减2
				if len(result_list) and result_list[1] == 4:
					sub_all = 0
					for i, p in enumerate(self.players_list):
						if i != idx and p is not None:
							sub_all += p.add_score(-2)
							DEBUG_MSG("{} cal_kong_win_score 4kings idx:{}, score:{}-{}".format(self.prefixLogStr, i, -2, sub_all))
					self.players_list[idx].add_score(-sub_all)
					DEBUG_MSG("{} cal_kong_win_score 4kings idx:{}, score:{}".format(self.prefixLogStr, idx, -sub_all))
			# 返还杠分
			for i, p in enumerate(self.players_list):
				if i == fromIdx:
					p.add_kong_score(-3)
					DEBUG_MSG("{} return_kong_score idx:{}, score:{}".format(self.prefixLogStr, i, -3))
				else:
					p.add_kong_score(1)
					DEBUG_MSG("{} return_kong_score idx:{}, score:{}".format(self.prefixLogStr, i, 1))
		elif aid == const.OP_GIVE_WIN:
			relations = self.job_relation(idx)
			if (result_list[5] > 0 or result_list[6] > 0 or result_list[7] > 0) and len(relations) > 0:  # 承包、反承包
				sub_all = 0
				for x in relations:
					if x[0] == idx:  # 承包
						if result_list[5] > 0:
							sub_all += self.players_list[x[1]].add_score(-20)
							DEBUG_MSG("{} cal_give_score idx:{}, score:{}-{}".format(self.prefixLogStr, x[1], -20, sub_all))
						elif result_list[6] > 0:
							sub_all += self.players_list[x[1]].add_score(-30)
							DEBUG_MSG("{} cal_give_score idx:{}, score:{}-{}".format(self.prefixLogStr, x[1], -30, sub_all))
						elif result_list[7] > 0:
							sub_all += self.players_list[x[1]].add_score(-30)
							DEBUG_MSG("{} cal_give_score idx:{}, score:{}-{}".format(self.prefixLogStr, x[1], -30, sub_all))
					else:  # 反承包
						if result_list[5] > 0:
							sub_all += self.players_list[x[0]].add_score(-20)
							DEBUG_MSG("{} cal_give_score idx:{}, score:{}-{}".format(self.prefixLogStr, x[0], -20, sub_all))
						elif result_list[6] > 0:
							sub_all += self.players_list[x[0]].add_score(-30)
							DEBUG_MSG("{} cal_give_score idx:{}, score:{}-{}".format(self.prefixLogStr, x[0], -30, sub_all))
						elif result_list[7] > 0:
							sub_all += self.players_list[x[0]].add_score(-30)
							DEBUG_MSG("{} cal_give_score idx:{}, score:{}-{}".format(self.prefixLogStr, x[0], -30, sub_all))
				self.players_list[idx].add_score(-sub_all)
				DEBUG_MSG("{} cal_give_score idx:{}, score:{}".format(self.prefixLogStr, idx, -sub_all))
				# 非承包关系玩家 放炮出一半分
				sub_all = 0
				if all(fromIdx not in x for x in relations):
					if result_list[5] > 0:
						sub_all += self.players_list[fromIdx].add_score(-10)
						DEBUG_MSG("{} cal_give_score give_idx:{}, score:{}-{}".format(self.prefixLogStr, fromIdx, -10, sub_all))
					elif result_list[6] > 0:
						sub_all += self.players_list[fromIdx].add_score(-15)
						DEBUG_MSG("{} cal_give_score give_idx:{}, score:{}-{}".format(self.prefixLogStr, fromIdx, -15, sub_all))
					elif result_list[7] > 0:
						sub_all += self.players_list[fromIdx].add_score(-15)
						DEBUG_MSG("{} cal_give_score give_idx:{}, score:{}-{}".format(self.prefixLogStr, fromIdx, -15, sub_all))
				self.players_list[idx].add_score(-sub_all)
				DEBUG_MSG("{} cal_give_score win_idx:{}, score:{}".format(self.prefixLogStr, idx, -sub_all))
			else:
				sub_all = 0
				for i, p in enumerate(self.players_list):
					if i != idx:
						if i == fromIdx:
							sub_all += p.add_score(-score)
							DEBUG_MSG("{} cal_give_score idx:{}, score:{}-{}".format(self.prefixLogStr, i, -score, sub_all))
						else:
							sub_all += p.add_score(int(-score / 2))
							DEBUG_MSG("{} cal_give_score idx:{}, score:{}-{}".format(self.prefixLogStr, i, int(-score / 2), sub_all))
				self.players_list[idx].add_score(-sub_all)
				DEBUG_MSG("{} cal_give_score idx:{}, score:{}".format(self.prefixLogStr, idx, -sub_all))

				# 四财神 每家 减2
				if len(result_list) and result_list[1] == 4:
					sub_all = 0
					for i, p in enumerate(self.players_list):
						if i != idx and p is not None:
							sub_all += p.add_score(-2)
							DEBUG_MSG("{} cal_give_win_score 4kings idx:{}, score:{}-{}".format(self.prefixLogStr, i, -2, sub_all))
					self.players_list[idx].add_score(-sub_all)
					DEBUG_MSG("{} cal_give_win_score 4kings idx:{}, score:{}".format(self.prefixLogStr, idx, -sub_all))
		elif aid == const.OP_WREATH_WIN:
			pass