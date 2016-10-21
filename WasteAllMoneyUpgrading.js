var itemsToUpgrade = {'helmet': true, 'coat': true, 'pants': true, 'shoes': true, 'gloves': true, 'staff': true};
var assumedItemCost = 10000;
var weaponArmorUpgradeItemName = 'scroll0';
var weaponArmorUpgradeItemCost = 1000;

var desiredLevel = 5;
var minimumAllowedGoldAmount = 20000;

var lastItemUpgradeIndex = -1;
var lastItemUpgradeName = null;

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
            if (item.level < 5) {
                itemIndex = i;
                break;
            }
        }
    }

    if (lastItemUpgradeIndex >= 0) {
        if (!character.items[lastItemUpgradeIndex]) {
            set_message('Last upgrade failed.');

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
    } else {
        lastItemUpgradeName = null;
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
            var result = upgrade(itemIndex, scrollIndex);
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
}, 250);