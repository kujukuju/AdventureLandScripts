var itemsToUpgrade = {'helmet': true, 'coat': true, 'pants': true, 'shoes': true, 'gloves': true, 'staff': true};
var assumedItemCost = 10000;
var weaponArmorUpgradeItemName = 'scroll0';
var weaponArmorUpgradeItemCost = 1000;

var desiredLevel = 7;
var minimumAllowedGoldAmount = 20000;

var lastItemUpgradeIndex = -1;
var lastItemUpgradeLevel = null;
var lastItemUpgradeName = null;

// {phelmet: {1: 2}}
var debugItemNameToAttemptCountArray = JSON.parse(localStorage.getItem('debugItemNameToAttemptCountArray')) || {};
var debugItemNameToFailCountArray = JSON.parse(localStorage.getItem('debugItemNameToFailCountArray')) || {};

var debugLogFail = (name, level) => {
    if (!debugItemNameToFailCountArray[name]) {
        debugItemNameToFailCountArray[name] = {};
    }

    if (!debugItemNameToFailCountArray[name].hasOwnProperty(level)) {
        debugItemNameToFailCountArray[name][level] = 0;
    }

    debugItemNameToFailCountArray[name][level]++;
};

var debugLogAttempt = (name, level) => {
    if (!debugItemNameToAttemptCountArray[name]) {
        debugItemNameToAttemptCountArray[name] = {};
    }

    if (!debugItemNameToAttemptCountArray[name].hasOwnProperty(level)) {
        debugItemNameToAttemptCountArray[name][level] = 0;
    }

    debugItemNameToAttemptCountArray[name][level]++;
};

var getScrollIndex = () => {
    for (var i = 0; i < character.items.length; i++) {
        var item = character.items[i];
        if (!item) {
            continue;
        }

        if (item.name == weaponArmorUpgradeItemName) {
            return i;
        }
    }

    return -1;
};

var upgradeOnce = () => {
    var itemIndex = -1;

    for (var i = 0; i < character.items.length; i++) {
        var item = character.items[i];
        if (!item) {
            continue;
        }

        if (itemsToUpgrade[item.name]) {
            if (item.level < desiredLevel) {
                itemIndex = i;
                break;
            }
        }
    }

    if (lastItemUpgradeIndex >= 0) {
        if (!character.items[lastItemUpgradeIndex]) {
            set_message('Last upgrade failed.');
            debugLogFail(lastItemUpgradeName, lastItemUpgradeLevel);

            if (character.gold - assumedItemCost >= minimumAllowedGoldAmount) {
                buy(lastItemUpgradeName, 1);
            } else {
                set_message('Could not buy item ' + lastItemUpgradeName + '. Not enough money.');
            }
        }
    }

    lastItemUpgradeIndex = itemIndex;
    if (character.items[lastItemUpgradeIndex]) {
        lastItemUpgradeName = character.items[lastItemUpgradeIndex].name;
        lastItemUpgradeLevel = character.items[itemIndex].level;
    } else {
        lastItemUpgradeName = null;
        lastItemUpgradeLevel = null;
    }

    if (itemIndex >= 0) {
        var scrollIndex = getScrollIndex();
        var scrollCount = character.items[scrollIndex].q;

        if (scrollCount <= 1) {
            if (character.gold - weaponArmorUpgradeItemCost >= minimumAllowedGoldAmount) {
                buy(weaponArmorUpgradeItemName, 1);
            } else {
                set_message('Could not buy an upgrade scroll. Not enough money.');
                return;
            }
        }

        if (scrollIndex >= 0) {
            set_message('Upgrading item ' + character.items[itemIndex].name + '.');
            debugLogAttempt(lastItemUpgradeName, character.items[itemIndex].level);
            upgrade(itemIndex, scrollIndex);
        }
    }
};

var getAllItemsOnCharacter = () => {
    var returnList = [];

    for (var i = 0; i < character.items.length; i++) {
        var item = character.items[i];
        if (!item) {
            continue;
        }

        returnList.push(item.name);
    }

    if (character.slots['helmet']) {
        returnList.push(character.slots['helmet'].name);
    }
    if (character.slots['shoes']) {
        returnList.push(character.slots['shoes'].name);
    }
    if (character.slots['ring1']) {
        returnList.push(character.slots['ring1'].name);
    }
    if (character.slots['mainhand']) {
        returnList.push(character.slots['mainhand'].name);
    }
    if (character.slots['chest']) {
        returnList.push(character.slots['chest'].name);
    }
    if (character.slots['gloves']) {
        returnList.push(character.slots['gloves'].name);
    }
    if (character.slots['amulet']) {
        returnList.push(character.slots['amulet'].name);
    }
    if (character.slots['belt']) {
        returnList.push(character.slots['belt'].name);
    }
    if (character.slots['pants']) {
        returnList.push(character.slots['pants'].name);
    }

    return returnList;
};

setInterval(function() {
    upgradeOnce();

    localStorage.setItem('debugItemNameToAttemptCountArray', JSON.stringify(debugItemNameToAttemptCountArray));
    localStorage.setItem('debugItemNameToFailCountArray', JSON.stringify(debugItemNameToFailCountArray));

    var itemNames = Object.keys(debugItemNameToFailCountArray);
    for (var i = 0; i < itemNames.length; i++) {
        var name = itemNames[i];

        var attemptKeys = Object.keys(debugItemNameToFailCountArray[name]);
        for (var a = 0; a < attemptKeys.length; a++) {
            var attemptKey = attemptKeys[a];

            var failCount = debugItemNameToFailCountArray[name][attemptKey];
            var attemptCount = debugItemNameToAttemptCountArray[name][attemptKey];
            var percentChance = Math.round((attemptCount - failCount) / attemptCount * 10000) / 100;

            console.log('Item ' + name + '. Level ' + attemptKey + '. Has a ' + percentChance + '% chance to succeed. Tried ' + attemptCount + ' times.');
        }
    }
}, 250);