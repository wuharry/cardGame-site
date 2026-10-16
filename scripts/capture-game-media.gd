extends SceneTree
## Run with Godot --path <isolated-game-project> --script <this-file> -- <outdir> <source-commit> <capture-date>.
## Real background rendering, temporary player data, and clearly labelled display fixtures.
const PROBE := preload("res://tests/card_stat_readability_review.gd")
const REVIEW := preload("res://tests/environment_art_review.gd")
const RELEASE := preload("res://src/release/release_info.gd")
var surface: SubViewport
var directory: String
var captures: Array[Dictionary] = []

func _initialize() -> void:
	root.hide()
	create_timer(100).timeout.connect(func() -> void: push_error("Website capture timeout"); quit(1))
	_run.call_deferred()

func _save(slug: String, note: String) -> void:
	await process_frame
	RenderingServer.force_draw(false)
	var image := surface.get_texture().get_image()
	assert(image.get_size() == Vector2i(1280, 720))
	assert(image.save_png(directory.path_join(slug + ".png")) == OK)
	captures.append({"slug": slug, "source": slug + ".png", "note": note})
	print("Captured ", slug)

func _run() -> void:
	var args := OS.get_cmdline_user_args()
	if args.size() != 3 or DisplayServer.get_name() == "headless": quit(2); return
	directory = args[0]
	DirAccess.make_dir_recursive_absolute(directory)
	await process_frame
	root.get_node("AppSettings").anonymous_play_stats = false
	surface = SubViewport.new()
	surface.size = Vector2i(1280, 720)
	surface.own_world_3d = true
	surface.gui_disable_input = true
	surface.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	root.add_child(surface)
	for arena: String in ["forest", "caverns", "frostlands"]:
		var scene := await PROBE.prepare(self, PackedStringArray([
			"no-pointer", "arena=res://scenes/arena_" + arena + ".tscn"]))
		scene.reparent(surface, false)
		surface.msaa_3d = root.msaa_3d
		surface.screen_space_aa = root.screen_space_aa
		var cm: Node = scene.get_node("CardManger")
		var bm: BattleManager = cm.battle_manager
		var hand: Array[CardData] = []
		for id: String in ["swordsman", "archer", "priest", "arcana_fireblast", "equip_mithril_plate", "ward_thorn_sigil"]:
			hand.append(load("res://data/cards/" + id + ".tres"))
		bm.sides.player.hand.assign(hand)
		cm.player_hand.rebuild_from(hand, false)
		for placement: Array in [["player_front", 0, "swordsman"], ["player_front", 2, "knight"],
				["player_back", 1, "priest"], ["enemy_front", 1, "lizard_warrior"],
				["enemy_front", 3, "skeleton"], ["enemy_back", 2, "frost_witch"]]:
			var slots := get_nodes_in_group(placement[0])
			assert(slots.size() == 4)
			bm.spawn_unit(load("res://data/cards/" + placement[2] + ".tres"), slots[placement[1]])
		bm.turn = 5
		bm.sides.player.mana_max = 6
		bm.sides.player.mana = 7
		bm.sides.player.temp_mana = 2
		bm._emit_state()
		await create_timer(1.5).timeout
		await _save("arena-" + arena, "R11 原始碼原生展示配置：四路前後排、新 HUD 與六張手牌；不是自然對局或手機效能驗收。")
		if arena == "forest":
			await _save("hero-battlefield", "R11 森林原生展示配置：四路前後排、HD-2D 英雄、新 HUD 與持牌方向；不是自然對局紀錄。")
		await REVIEW.cleanup(self, scene)
	var temporary := DirAccess.create_temp("deckmarch-website-menu")
	var profile := preload("res://src/account/guest_profile.gd").new()
	profile.open(temporary.get_current_dir().path_join("guest.cfg"))
	var collection := preload("res://src/collection/player_collection.gd").new()
	collection.open(profile.uuid, temporary.get_current_dir().path_join("collection.cfg"))
	var library := preload("res://src/collection/deck_library.gd").new()
	library.open(collection)
	var menu: Node = load("res://scenes/main_menu.tscn").instantiate()
	menu.guest_profile = profile
	menu.player_collection = collection
	menu.deck_library = library
	menu.monitor_enabled = false
	menu.update_checks_enabled = false
	surface.add_child(menu)
	await create_timer(1.5).timeout
	menu._menu_scroll.scroll_vertical = 0
	await _save("main-menu", "R11 原生主選單；暫存新訪客資料、新品牌與三十包新手額度入口。")
	for child: Node in menu.get_children():
		if not child is CanvasLayer: continue
		var ui := child.get_node_or_null("UI")
		if ui == null: continue
		for item: CanvasItem in ui.get_children():
			if item != ui.get_child(0): item.hide()
	await _save("town", "R11 主選單實際使用的原創天文台背景；擷取時只隱藏選單文字層，未後製合成。")
	await REVIEW.cleanup(self, menu)
	var file := FileAccess.open(directory.path_join("capture-manifest.json"), FileAccess.WRITE)
	file.store_string(JSON.stringify({"sourceVersion": RELEASE.VERSION, "sourceCommit": args[1],
		"capturedOn": args[2], "renderer": RenderingServer.get_current_rendering_method(),
		"platform": OS.get_name(), "width": 1280, "height": 720, "captures": captures}, "\t") + "\n")
	file.close()
	surface.queue_free()
	await process_frame
	quit.call_deferred(0)
