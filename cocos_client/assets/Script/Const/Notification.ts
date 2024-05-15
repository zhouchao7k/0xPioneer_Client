export enum NotificationName {
    CONFIG_LOADED = 100,
    GAME_INITED,
    USER_LOGIN_SUCCEED,

    CHANGE_CURSOR,
    GAME_CAMERA_POSITION_CHANGED,
    GAME_CAMERA_ZOOM_CHANGED,
    GAME_INNER_AND_OUTER_CHANGED,
    GAME_INNER_BUILDING_LATTICE_EDIT_CHANGED,
    GAME_INNER_LATTICE_EDIT_ACTION_MOUSE_DOWN,
    GAME_INNER_LATTICE_EDIT_ACTION_MOUSE_UP,
    GAME_INNER_LATTICE_EDIT_ACTION_MOUSE_MOVE,

    RESOURCE_GETTED,
    RESOURCE_CONSUMED,

    GENERATE_ENERGY_NUM_DID_CHANGE,

    INNER_BUILDING_BEGIN_UPGRADE,
    INNER_BUILDING_UPGRADE_COUNT_TIME_CHANGED,
    INNER_BUILDING_UPGRADE_FINISHED,

    // language
    CHANGE_LANG,

    // MainBuildUpgrade
    MAIN_BUILD_LEVEL_UP,

    FIGHT_FINISHED,
    MINING_FINISHED,

    // rookie guide
    ROOKIE_GUIDE_BEGIN_EYES,
    ROOKIE_GUIDE_THIRD_EYES,
    ROOKIE_GUIDE_END_PIONEER_WAKE_UP,

    // artifact
    ARTIFACT_CHANGE,
    ARTIFACT_EQUIP_DID_CHANGE,

    // item
    ITEM_CHANGE,

    // event
    EVENT_STEPEND,

    // BattleReport
    BATTLE_REPORT_LIST_CHANGED,

    GENERATE_TROOP_TIME_COUNT_CHANGED,
    GENERATE_TROOP_NUM_TO_CHANGE,

    // map building
    BUILDING_DID_HIDE,
    BUILDING_DID_SHOW,
    BUILDING_FACTION_CHANGED,

    BUILDING_WORMHOLE_COUNT_DOWN_TIME_DID_CHANGE,
    BUILDING_WORMHOLE_COUNT_DOWN_TIME_DID_FINISH,

    BUILDING_TAVERN_COUNT_DOWN_TIME_DID_CHANGE,
    BUILDING_TAVERN_COUNT_DOWN_TIME_DID_FINISH,
    BUILDING_NEW_PIONEER_DID_CHANGE,

    BUILDING_INSERT_DEFEND_PIONEER,
    BUILDING_REMOVE_DEFEND_PIONEER,

    //---------------------- userInfo
    USERINFO_DID_CHANGE_NAME,
    USERINFO_DID_CHANGE_EXP,
    USERINFO_DID_CHANGE_LEVEL,
    USERINFO_DID_CHANGE_TREASURE_PROGRESS,
    //---------------------- task
    TASK_CANNOTGET,
    TASK_NEW_GETTED,
    TASK_FAILED,
    TASK_STEP_FINISHED,
    TASK_FINISHED,
    //---------------------- map member
    MAP_MEMBER_CHANGE_SHOW_HIDE,
    MAP_MEMBER_CHANGE_FACTION,

    MAP_MEMEBER_FIGHT_BEGIN,
    MAP_MEMEBER_FIGHT_DID_ATTACK,
    MAP_MEMEBER_FIGHT_END,

    MAP_PIONEER_GET_NEW_TALK,
    MAP_PIONEER_USE_NEW_TALK,
    MAP_PIONEER_SHOW_HIDE_COUNT_CHANGED,
    MAP_PIONEER_REBIRTH_COUNT_CHANGED,
    MAP_PIONEER_GET_TALK_COUNT_CHANGED,
    MAP_PIONEER_GET_NEW_PIONEER,

    MAP_PIONEER_BEGIN_MOVE,
    MAP_PLAYER_PIONEER_DID_MOVE_STEP,
    MAP_PIONEER_MOVE_MEETTED,
    MAP_PIONEER_LOGIC_MOVE,

    MAP_PIONEER_SHOW_CHANGED,
    MAP_PIONEER_TALK_CHANGED,
    MAP_PIONEER_FACTION_CHANGED,
    MAP_PIONEER_ACTIONTYPE_CHANGED,
    MAP_PIONEER_EVENTSTATUS_CHANGED,
    MAP_PIONEER_HP_CHANGED,
    MAP_PIONEER_HPMAX_CHANGED,
    MAP_PIONEER_ATTACK_CHANGED,
    MAP_PIONEER_DEFEND_CHANGED,
    MAP_PIONEER_SPEED_CHANGED,

    MAP_PIONEER_REBIRTH_BEGIN,
    MAP_PIONEER_REBIRTH_FINISHED,

    MAP_PIONEER_EXPLORED_PIONEER,
    MAP_PIONEER_EXPLORED_BUILDING,
    MAP_PIONEER_MINING_BUILDING,
    MAP_PIONEER_EVENT_BUILDING,
    //---------------------- dialog
    DIALOG_SHOW,
    CHOOSE_GANGSTER_ROUTE,
    GAME_SHOW_PROP_GET,
    GAME_SHOW_CENTER_TIP,

    NFTDIDLEVELUP,
    NFTDIDRANKUP,
    NFTDIDFORGETSKILL,
    NFTDIDLEARNSKILL,
    NFTDIDCHANGEWORKBUILDING,
}
