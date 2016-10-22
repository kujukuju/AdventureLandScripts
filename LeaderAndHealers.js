// Hey there!
// This is CODE, lets you control your character with code.
// If you don't know how to code, don't worry, It's easy.
// Just set attack_mode to true and ENGAGE!

var attack_mode = true;

// first player in the list is the leader
var friendsNames = ["Bunnub", "Elytra", "Renge", "Chungster"];
var friends = [];
for (var i = 0; i < friendsNames.length; i++) {
    friends[i] = get_player(friendsNames[i]);
}
var leader = get_player(friendsNames[0]);
var leaderPath = [];
var leaderPathLength = 0;
var myName = character.name;
var myPosition = 0;
for (var i = 0; i < friendsNames.length; i++) {
    if (friendsNames[i] == myName) {
        myPosition = i;
        break;
    }
}
var amLeader = myPosition === 0;
var className = character.skin.substring(1, character.skin.length);
var previousTarget = null;

var getMissingHealth = (entity) => {
    return entity.max_hp - entity.hp;
};

var getHealthPercent = (entity) => {
    return entity.hp / entity.max_hp;
};

var getMissingMana = (entity) => {
    return entity.max_mp - entity.mp;
};

var getManaPercent = (entity) => {
    return entity.mp / entity.max_mp;
};

var isAlive = (entity) => {
    return entity ? !entity.dead : false;
};

var isFriendly = (entity) => {
    if (!entity || !entity.name) {
        return false;
    }

    for (var i = 0; i < friendsNames.length; i++) {
        if (friendsNames[i] == entity.name) {
            return true;
        }
    }

    return false;
};

var getTarget = () => {
    if (!isAlive(previousTarget)) {
        previousTarget = null;
    }

    return previousTarget;
};

var setTarget = (target) => {
    previousTarget = target;
};

var updateVariables = () => {
    for (var i = 0; i < friends.length; i++) {
        friends[i] = get_player(friendsNames[i]);
    }

    leader = friends[0];
};

var setPlayersTarget = (player, target) => {
    localStorage.setItem(player.id + '.target.id', target ? target.id : null);
};

var getPlayersTarget = (player) => {
    var targetID = localStorage.getItem(player.id + '.target.id');

    for (var id in parent.entities) {
        if (!parent.entities.hasOwnProperty(id)) {
            continue;
        }

        var currentTarget = parent.entities[id];
        if (currentTarget.id == targetID) {
            return currentTarget;
        }
    }

    return null;
};

var healFriendsIfNecessary = () => {
    if (className != 'priest') {
        return false;
    }

    var mostMissingHealth = 0;
    var mostMissingHealthFriend = null;

    for (var i = 0; i < friendsNames.length; i++) {
        var friend = friends[i];
        if (!friend) {
            continue;
        }
        var missingHealth = getMissingHealth(friend);

        if (missingHealth >= 80 && missingHealth > mostMissingHealth && isAlive(friend) && can_attack(friend)) {
            mostMissingHealth = missingHealth;
            mostMissingHealthFriend = friend;
        }
    }

    if (mostMissingHealthFriend !== null) {
        heal(mostMissingHealthFriend);
        set_message('Healing ' + mostMissingHealthFriend.name);
        return true;
    }

    return false;
};

var usePotionsIfNecessary = () => {
    var healthPercent = getHealthPercent(character);
    var manaPercent = getManaPercent(character);

    if (healthPercent < 0.5 || manaPercent < 0.5) {
        // set_message('Using Potions');
        use_hp_or_mp();
    }
};

var getNearestMonster = (limits) => {
    var target = null;
    var shortestDistance = 99999999;

    var averagePosition = [0, 0];
    var notFoundCount = 0;
    for (var i = 0; i < friendsNames.length; i++) {
        var friend = get_player(friendsNames[i]);
        if (!friend) {
            notFoundCount++;
            continue;
        }

        averagePosition[0] += friend.real_x;
        averagePosition[1] += friend.real_y;
    }
    averagePosition[0] /= friendsNames.length - notFoundCount;
    averagePosition[1] /= friendsNames.length - notFoundCount;

    for (var id in parent.entities) {
        if (!parent.entities.hasOwnProperty(id)) {
            continue;
        }

        var currentTarget = parent.entities[id];
        if (!validTarget(currentTarget, limits)) {
            continue;
        }

        var currentTargetPosition = [currentTarget.real_x, currentTarget.real_y];
        var currentDistanceSquared = sqrDist(currentTargetPosition, averagePosition);

        if (currentDistanceSquared < shortestDistance) {
            shortestDistance = currentDistanceSquared;
            target = currentTarget;
        }
    }

    return target;
};

var getHighestHealthMonster = (limits) => {
    var target = null;
    var highestHealth = 0;

    var averagePosition = [0, 0];
    var notFoundCount = 0;
    for (var i = 0; i < friendsNames.length; i++) {
        var friend = friends[i];
        if (!friend) {
            notFoundCount++;
            continue;
        }

        averagePosition[0] += friend.real_x;
        averagePosition[1] += friend.real_y;
    }
    averagePosition[0] /= friends.length - notFoundCount;
    averagePosition[1] /= friends.length - notFoundCount;

    for (var id in parent.entities) {
        if (!parent.entities.hasOwnProperty(id)) {
            continue;
        }

        var currentTarget = parent.entities[id];
        if (!validTarget(currentTarget, limits)) {
            continue;
        }

        var currentTargetHealthPercent = getHealthPercent(currentTarget);

        if (currentTargetHealthPercent > highestHealth && in_attack_range(currentTarget)) {
            highestHealth = currentTargetHealthPercent;
            target = currentTarget;
        }
    }

    return target;
};

var validTarget = (target, limits) => {
    if (
        (target.type != 'monster') ||
        (limits.max_attack && target.attack > limits.max_attack) ||
        (limits.min_xp && target.xp < limits.min_xp) ||
        (!isAlive(target)) ||
        (isFriendly(target))
    ) {
        return false;
    }

    return true;
};

var safeStringify = (object) => {
    object.transform = null;

    return JSON.stringify(object);
};

var attackCorrectTarget = () => {
    if (myPosition === 0) {
        var target = getTarget();
        if (isFriendly(target)) {
            target = null;
        }

        if (!target) {
            target = getNearestMonster({min_xp: 100, max_attack: 180});
        }

        if (target && in_attack_range(target) && can_attack(target)) {
            attack(target);
        }

        setTarget(target);
        setPlayersTarget(character, target);
    } else {
        var target = getPlayersTarget(leader);
        if (isFriendly(target)) {
            target = null;
        }

        // don't attack before the leader attacks
        if (getMissingHealth(target) === 0) {
            target = null;
        }

        if (target && in_attack_range(target) && can_attack(target)) {
            attack(target);
        }

        setTarget(target);
        setPlayersTarget(character, target);
    }/* else {
        var target = getTarget();
        if (isFriendly(target)) {
            target = null;
        }

        if (!target) {
            target = getNearestMonster({min_xp: 100, max_attack: 180});
            if (target && in_attack_range(target)) {
                setTarget(target);
            } else {
                return;
            }
        }

        if (in_attack_range(target) && can_attack(target)) {
            attack(target);
        }

        localStorage.setItem(character.id + '.target.id', target === null ? null : target.id);
    }*/
};

var getLeaderPathLength = () => {
    if (leaderPath.length < 2) {
        return 0;
    }

    var returnValue = 0;

    for (var i = 0; i < leaderPath.length - 1; i++) {
        var p1 = leaderPath[i];
        var p2 = leaderPath[i + 1];

        returnValue += Math.sqrt(sqrDist(p1, p2));
    }

    return returnValue;
};

var updateLeaderPath = () => {
    var currentLeaderPosition = [leader.real_x, leader.real_y];
    if (leaderPath.length === 0) {
        leaderPath.push(currentLeaderPosition);
    }
    var lastLeaderPosition = leaderPath[leaderPath.length - 1];

    var distanceFromLastToCurrent = Math.sqrt(sqrDist(currentLeaderPosition, lastLeaderPosition));
    if (distanceFromLastToCurrent > 0.1) {
        leaderPath.push(currentLeaderPosition);
    }

    // recalculating every time because I think it might be accumulating error
    leaderPathLength = getLeaderPathLength();

    if (leaderPath.length === 1) {
        return;
    }

    var leaderLagDistance = getLeaderLagDistance();
    while (true) {
        var firstPathPoint = leaderPath[0];
        var secondPathPoint = leaderPath[1];

        var firstPathDistance = Math.sqrt(sqrDist(firstPathPoint, secondPathPoint));
        // if removing these points still gives us enough length to trail the leader then remove them
        if (leaderPathLength - firstPathDistance >= leaderLagDistance) {
            leaderPathLength -= firstPathDistance;
            leaderPath.shift();
        } else {
            break;
        }
    }
};

var getPositionAlongLeaderPath = () => {
    var lagDistance = getLeaderLagDistance();
    var currentDistance = 0;

    for (var i = leaderPath.length - 1; i >= 1; i--) {
        var previousPoint = leaderPath[i - 1];
        var currentPoint = leaderPath[i];
        var dx = previousPoint[0] - currentPoint[0];
        var dy = previousPoint[1] - currentPoint[1];

        var distanceBetweenPoints = Math.sqrt(sqrDist(previousPoint, currentPoint));
        var newDistance = currentDistance + distanceBetweenPoints;

        if (currentDistance < lagDistance && newDistance >= lagDistance) {
            var percentToPreviousPoint = (lagDistance - currentDistance) / distanceBetweenPoints;
            return [currentPoint[0] + dx * percentToPreviousPoint, currentPoint[1] + dy * percentToPreviousPoint];
        }

        currentDistance = newDistance;
    }

    return leaderPath[0];
};

var getLeaderLagDistance = () => {
    return myPosition * 20;
};

setInterval(function(){
    if (!attack_mode) {
        return;
    }

    updateVariables();

    loot();

    if (!amLeader) {
        updateLeaderPath();
        var desiredPosition = getPositionAlongLeaderPath();
        var characterPosition = [character.real_x, character.real_y];

        var distanceSquared = sqrDist(desiredPosition, characterPosition);
        if (distanceSquared > 0.1) {
            move(desiredPosition[0], desiredPosition[1]);
        }
    }

    usePotionsIfNecessary();

    var healed = healFriendsIfNecessary();

    if (!healed) {
        attackCorrectTarget();
    }
}, 1000 / 10);

var sqrDist = (p1, p2) => {
    var dx = p2[0] - p1[0];
    var dy = p2[1] - p1[1];

    return dx * dx + dy * dy;
};

// NOTE: If the tab isn't focused, browsers slow down the game
// Learn Javascript: https://www.codecademy.com/learn/javascript
// Write your own CODE: https://github.com/kaansoral/adventureland
