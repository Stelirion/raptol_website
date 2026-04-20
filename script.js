// ====== RAPTOL — UNIVERSE ENGINE v5.0 (Premium Visuals) ======
'use strict';

/**
 * 0. COORDINATION & OPTIMIZATION
 */
const SYSTEM_STATE = {
    mode: '2D', // '2D' | '3D'
    textureWorker: null,
    pendingTextures: 0,
    isInitialized: false,
};

class TextureWorkerManager {
    constructor() {
        this.worker = null;
        this.callbacks = new Map();
        this.requestId = 0;
        try {
            this.worker = new Worker('texture-worker.js');
            this.worker.onmessage = (e) => {
                const { id, buffer, size } = e.data;
                const callback = this.callbacks.get(id);
                if (callback) {
                    this.callbacks.delete(id);
                    callback({ buffer, size });
                }
            };
            this.worker.onerror = (err) => {
                console.warn("Texture Worker error:", err);
                this.worker = null;
            };
        } catch(e) {
            console.warn("Could not initialize Web Worker, falling back to main thread:", e);
            this.worker = null;
        }
    }

    requestTexture(colorHex, type) {
        const id = this.requestId++;
        if (!this.worker) {
            return Promise.resolve(this.fallbackGenerate(colorHex, type));
        }
        return new Promise(resolve => {
            this.callbacks.set(id, resolve);
            this.worker.postMessage({ id, colorHex, type });
            setTimeout(() => {
                if(this.callbacks.has(id)) {
                    this.callbacks.delete(id);
                    resolve(this.fallbackGenerate(colorHex, type));
                }
            }, 5000);
        });
    }

    fallbackGenerate(colorHex, type) {
        const size = (type === 'star' || type === 'flame') ? 256 : 64;
        const buffer = new Uint8ClampedArray(size * size * 4);
        for(let i=0; i<size*size*4; i+=4) {
            buffer[i] = 100; buffer[i+1] = 100; buffer[i+2] = 100; buffer[i+3] = 255;
        }
        return { buffer, size };
    }
}

SYSTEM_STATE.textureWorker = new TextureWorkerManager();

async function getTextureAsync(colorHex, type) {
    const { buffer, size } = await SYSTEM_STATE.textureWorker.requestTexture(colorHex, type);
    const tex = new THREE.DataTexture(buffer, size, size, THREE.RGBAFormat);
    tex.needsUpdate = true;
    return tex;
}

let _texLoader = null;
function getLoader() {
    if (!_texLoader) _texLoader = new THREE.TextureLoader();
    return _texLoader;
}

function loadRealTexture(path) {
    return new Promise((resolve, reject) => {
        getLoader().load(path, resolve, undefined, reject);
    });
}

// Mapping: album key → real texture file
const TEXTURE_MAP = {
    'STAR':        { diffuse: 'textures/2k_sun.jpg' },
    'STARLIGHT':   { diffuse: 'textures/2k_jupiter.jpg' },
    'ULONIA':      { diffuse: 'textures/2k_earth_daymap.jpg', clouds: 'textures/2k_earth_clouds.jpg', normal: 'textures/2k_earth_normal_map.jpg' },
    'VIRGO':       { diffuse: 'textures/2k_neptune.jpg' },
    'THE REVENGE': { diffuse: 'textures/2k_mars.jpg' },
};


// ─────────────────────────────────────────────
// 1. DATA
// ─────────────────────────────────────────────
const ALBUM_DATA = {
    "DARKEST DREAMS": {
        type: "single", badge: "Nouveau Single",
        color: "#e8000a", color2: "#3d0000", size: 45, orbitRadius: 1750,
        listenUrl: "",
        description: "Le nouveau single. Death metal mélodique.",
        tracks: [
            {
                name: "Darkest Dreams",
                duration: "",
                credits: "",
                story: "J'ai grandi entouré d'ombres qui portaient des visages souriants. Des gens qui savaient exactement quoi dire pour que tu te sentes petit. Peu importe l'endroit, il y en avait toujours un. Ils ne frappaient pas. Ils n'avaient pas besoin de ça. Ils choisissaient leurs mots, ils te façonnaient, ils te faisaient croire que la douleur que tu ressentais était ta faute.\n\nDarkest Dreams, c'est leur voix que j'ai décidé d'incarner une dernière fois — non pas pour leur donner raison, mais pour la montrer telle qu'elle est. Froide. Calculée. Convaincue de sa propre grandeur. C'est un portrait sonore du mal ordinaire : celui qui dort dans le même lit que toi, qui mange à la même table, qui te dit qu'il t'aime pendant qu'il te détruit.\n\nEn chantant du point de vue du prédateur, j'ai compris quelque chose : la lumière la plus difficile à trouver, c'est celle qu'on a appris à ne pas mériter. Cette chanson, c'est pour tous ceux qui ont grandi dans ces rêves-là — et qui ont fini par se réveiller.",
                lyrics: "Welcome to my house; Down the darkest way\nI'm like santa claus, except I'll make you pay\nYour soul, your heart and your spirit Will be Mine\nYou might think you can defeat me but can you?\n\nI don't think so, so much that I am divine\nYou are blind, but the stars are already aligned\nYou'll see what I mean, when you go to sleep tonight\nAnd in your dreams, you will see the light\n\nCome, Come to me\nThen, I'll come to you\nInto your darkest dreams\nTo generate your screams\n\nAnd Come, Come to me\nThen, I'll come to you\nThe light goes out slowly\nThe madness takes you over completely\n\nYou can call for your crew, but no one is there\nAll those who knew the truth, were not spared\nThey were also trying to get their souls back\nBut against me no one survives\n\nI'm too strong, I'm too smart\nThis journey is long, but the end is in sight\nIt will be done in a few minutes\nYou can no longer run, the end has already come\n\nCome, Come to me\nThen, I'll come to you\nInto your darkest dreams\nTo generate your screams\n\nAnd Come, Come to me\nThen, I'll come to you\nThe light goes out slowly\nThe madness takes you over completely\n\nCome, Come to me\nThen, I'll come to you\nInto your darkest dreams\nTo generate your screams",
            }
        ]
    },
    "VIRGO": {
        type: "single", badge: "Single",
        color: "#00f0ff", size: 50, orbitRadius: 1450,
        listenUrl: "https://distrokid.com/hyperfollow/raptol/virgo",
        description: "Une exploration sonore de la constellation de la Vierge.",
        tracks: [
            {
                name: "Virgo",
                duration: "3:15",
                credits: "",
                story: "En 2020, Virgo est sortie — et les gens l'ont aimée. Elle a circulé, touché, résonné dans des endroits que Raptol n'avait pas imaginés.\n\nIl aurait pu la laisser vivre. Il a choisi de la faire disparaître. Non par doute, mais par exigence — parce qu'une chanson qui compte autant ne peut pas exister à moitié. Il l'a retirée, retravaillée, attendu qu'elle soit prête à revenir dans la meilleure version d'elle-même.\n\nVirgo parle de solitude choisie. De ce moment rare où l'on arrête de fuir sa propre compagnie, où le vide devient quelque chose de lumineux.",
                lyrics: "You think you know everything about me but\nI'm sure, i can surprise you\nYou wanna know they say I'm crazy, they say I'm not like that usually\nAnd I cannot stand the way they look at me, I feel so, guilty\nNo I cannot stand the way they hurt my soul\nI feel solo so solo\nI'm the only one who knows the truth\nI feel solo so solo yeah that's how I feel\nAnd I know that I can escape but I don't wanna go far away\nI feel solo so solo\n\nI feel like an empty shell\nI feel like I'm all alone\nI feel I'm just myself\nBut for the first time i don't want nothing else\nI feel alive , like I rise so let me shine from within like I'm the one and only\nSolo\n\nI'm the only one who knows the truth\nI feel solo, so solo yeah that's how I feel\nAnd i know that i can escape but i don't wanna go far away\nI feel solo, solo\n\nI feel solo, so solo that's how I feel\nand I feel solo, so solo that's how I feel\nI feel solo, that's how i feel\nSolo\nso solo, so solo, that's how i feel",
                clip: "https://www.youtube.com/watch?v=Fax3vYql9tY",
                spotify: "https://open.spotify.com/track/3r9aGRVmmKoM5DJasDfKuZ",
                bandcamp: "https://raptol.bandcamp.com/track/virgo"
            }
        ]
    },
    "STARLIGHT": {
        type: "album", badge: "Premier Album",
        color: "#ffd700", size: 70, orbitRadius: 700,
        ytPlaylist: "OLAK5uy_nwGxflWW1bDie9GYlo2BcDfMtewDiwtDg",
        listenUrl: "https://distrokid.com/hyperfollow/raptol/starlight",
        description: "Le premier album. Un voyage épique entre possession, lutte intérieure et rédemption. L'histoire de Raptol face à l'Étoile Rouge. Sorti le 4 mai 2025.",
        tracks: [
            { ytID:"4KNZSC169oc", name: "The Call",                duration: "2:30", credits: "Voix-off : Aulë", story: "Le commencement de la possession. Raptol est piégé dans les flammes et le silence — et c'est là que l'Étoile Rouge le trouve. Elle descend du ciel, elle l'appelle, elle lui offre une chaleur qui ressemble à de l'espoir. Il ne sait pas encore ce qu'elle est vraiment. Il répond à l'appel. C'est le moment où tout bascule.", lyrics: "when darkness fell,\nand everything was swallowed up by flames,\nonly hope shall remain.\n\nall of us summon our courage,\nto clean up anything left,\nthat was not damaged.\n\nlike deep in the pits of hell,\nI was trapped in jail,\nPraying for salvation.\n\nI wished I could be spotless,\nso i prayed for forgiveness,\nBut I kept staring into nothingness.\n\nDespite our failure,\nDespite their deception,\nI couldn't believe my eyes.\n\nAll of a sudden a shooting star,\ncame down from the sky,\ncalling and beckoning me.\n\nI felt its warmth, deep in my heart,\nIt reminded me an old memory,\nAn echo from the past.\n\nThis story healed my soul,\nThat's why you need to heed the call,\nBehold this is...\nStarlight.", spotify: "https://open.spotify.com/track/5qeLdzgGpiKjxyy18BzeZj", bandcamp: "https://raptol.bandcamp.com/track/the-call" },
            { ytID:"9Gxb_GYToLY", name: "Black Hole",              duration: "3:06", credits: "Rap : Diego",      story: "La possession s'installe. Raptol voit le monde à travers le filtre de l'Étoile Rouge — trahison partout, faux sourires, vautours. La rage remplace tout le reste. Il ne distingue plus ce qu'il ressentait vraiment de ce que l'Étoile lui fait croire. Il s'enfonce.", lyrics: "J'ai fini par changer, avalé par la nuit, le ciel est tout noir.\nPlein d'humains, mais peu d'espoir autour de moi.\nJ'attendais un merci, maintenant j'ai le sang chaud.\nIls vont savoir ce que ça fait quand il fait froid.\n\nLe sang glacial sur le bitume fait du verglas.\nPauvre de vous, la lumière des gyrophares me fait me donner un spectacle.\nToute la nuit dans mes oreilles, les mêmes problèmes, les mêmes horaires.\nLes mêmes sourires, les mêmes faux, comprends que je sois resté polaire.\n\nDans la misère ou le sommet, dans la journée ou le sommeil,\nJe me fais tromper par les autres, le diable s'amuse avec des sornettes.\n\nLa routine m'a tapé, mais la roue tournera.\nQuand j'serai plus à la merci de ces vautours de race.\n\nIls attendent que l'erreur soit faite, mais l'erreur est humaine.\nEt ces vauriens se gavent.\nMoi, j'ai faim, moi, j'ai froid.\nJ'me sens pas bien en pleine OD, j'rêve que le sang coulera.\nLa fin s'approche pour toi et moi.\n\nPour m'resonner, il s'fait tard.\nJ'vais faire une folie des grands soirs, trou noir.", spotify: "https://open.spotify.com/track/5KNsRujtB01YEHJyRs3488", bandcamp: "https://raptol.bandcamp.com/track/black-hole" },
            { ytID:"4qbmo2r0gJ4", name: "The Revenge",             duration: "4:12", credits: "Voix : Nïx",       story: "Raptol, possédé par l'Étoile Rouge, s'en prend à une figure toxique de son passé. La rage est réelle, l'envie de détruire aussi — mais au moment de frapper, quelque chose résiste. La possession lui donne la force, pas la liberté. La chanson se termine sans vengeance accomplie : même sous emprise, il y a encore quelque chose en lui qui refuse d'aller jusqu'au bout.", lyrics: "Let's talk about you, the pretty boy.\nYou were toxic, and you still be.\nYou were spreading rumors, maybe your life was too morose.\nYou wanted the fame, but let's be honest, you're just absurd.\nYou don't have to talk shit about my boyfriend, dear.\nYes, I see your text you sent to my friend.\nEveryone can be mean, everyone can be mad,\nEveryone can be cruel sometimes.\nEveryone can have other chances, so here I am to tell you why you can't have them.\n\nWe used to be friends when we were little,\nBut now how you broke him shows me how bad you are.\nI hope I'll never see you again.\nWait, in fact, I kinda want it, so you can see how better than you I am.\nAnd one more thing, you should stop stalking me because,\nYeah, in case you don't know, I see it.\nEveryone can be mean, everyone can be mad,\nEveryone can be cruel sometimes.\nEveryone can have other chances, so here I am to tell you why you can't have them.\n\nI won't get revenge, I'm so over that, so don't worry.\nYou won't have anything.\nYou won't recognize you.\nYou won't know I talk about you.\nYou won't even listen to those lyrics.\nEveryone can be mean, everyone can be mad,\nEveryone can be cruel sometimes.\nEveryone can have other chances, so here I am to tell you why you can't have them.", spotify: "https://open.spotify.com/track/34hH5TtnMX16bWCOpVfFej", bandcamp: "https://raptol.bandcamp.com/track/the-revenge" },
            { ytID:"D3At2YQuT78", name: "No Mercy",                duration: "3:16", credits: "Instrumental",     story: "La possession est totale. Il n'y a plus de mots — l'Étoile Rouge a pris le contrôle. La musique avance comme une force aveugle, sans merci. C'est le moment le plus sombre de l'album, le fond du gouffre.", lyrics: "", spotify: "https://open.spotify.com/track/40unzt1DXRV73rX972UO6E", bandcamp: "https://raptol.bandcamp.com/track/no-mercy" },
            { ytID:"wZrdrVuKCOw", name: "The Light",               duration: "1:25", credits: "Voix : Nïx",       story: "Raptol possédé commence à détruire ce qui l'entourait. La lumière ici, c'est ce qu'il était en train de perdre sans s'en rendre compte — une relation, une présence, quelqu'un qui l'aimait et qui finit par s'éloigner. Il est trop sous emprise pour le voir. Mais le récit, lui, le montre clairement.", lyrics: "Should like to be good,\nShould like to be great,\nBut all around her is making girls upset.\nShe's falling in love and now she regrets,\nIf only she knew that it was a bet.\n\nShould not be the light like the girls in the crew,\nAnd stay with the guys even if she needed you.\nShe could do anything just to be with you.\nOn start carrying, but that's overdue,\nShe can't believe it, this cannot be true.\nYou play with her heart and now she hates you.\n\nShe has a lot of dreams, but one thing is sure,\nShe'll never let someone make her fall again.\nRoses are red, violets are blue,\nYou think about her when you are in bed.\nNow you regret cause you love her too,\nBut now she's happy cause she forgets you.", spotify: "https://open.spotify.com/track/5lDH6GCG5wnkk9zbv2e4uh", bandcamp: "https://raptol.bandcamp.com/track/the-light" },
            { ytID:"MZv-lte9-ik", name: "Tell Me How You Feel Now", duration: "2:51", credits: "",               story: "La première vraie fissure dans la possession. Raptol reprend assez conscience pour voir les dégâts — une relation brisée, quelqu'un qu'il a quitté ou détruit. L'Étoile Rouge perd un peu de son emprise, et ce qui revient en premier c'est la douleur. La question revient en boucle, pas par amour, mais parce qu'il commence à redevenir lui-même.", lyrics: "It's not the first time, yeah I've been broken in my life,\nAnd it feels more like a memory,\nThe anger, the sadness, and worry.\nBut you, I wanna know if you're still the same,\nIf you still think of how it was insane.\nI know I destroyed you, hurt you, and leave you, so...\n\nTell me how you feel now.\nJust give me a sign.\nTell me how you feel now.\nJust give me a sign.\n\nAnd the guy standing by your side,\nIs he better than me, oh why?\nI wanna hit her, oh I'm so mad,\nBut I don't want you to see that.\nAnd you, I wanna know if you're still the same,\nIf you still think of how it was insane.\nI know I destroyed you, hurt you, and left you, so...\n\nTell me how you feel now.\nJust give me a sign.\nTell me how you feel now.\nJust give me a sign.\n\nWhy did you go with her?\nYou just left for no reason,\nI just wanna know how you feel now with this girl,\nBecause me without you, I'm like an empty corpse.", spotify: "https://open.spotify.com/track/1ReprSZkaydzA44A0O3mzd", bandcamp: "https://raptol.bandcamp.com/track/tell-me-how-you-feel-now" },
            { ytID:"foiAincw9Nc", name: "Neutron Star",            duration: "2:07", credits: "Instrumental",     story: "L'emprise faiblit. Raptol se retrouve seul avec lui-même pour la première fois depuis The Call — sans la rage de l'Étoile Rouge pour remplir le silence. La musique est lourde, dense, comme une gravité qui retient encore. C'est le moment charnière : il peut encore basculer dans un sens ou dans l'autre.", lyrics: "", spotify: "https://open.spotify.com/track/3sP8w8rmLAQfwz7ZDAjdzd", bandcamp: "https://raptol.bandcamp.com/track/neutron-star" },
            { ytID:"u0tvs87l8dc", name: "Starlight",               duration: "2:04", credits: "",               story: "La libération. Là où The Call était l'Étoile Rouge qui l'appelait dans le noir, Starlight est l'opposé — une lumière qui ne prend pas, qui guide. Raptol comprend qu'il était perdu bien avant la possession, et que c'est cette vulnérabilité que l'Étoile Rouge avait exploitée. L'emprise se brise. Il n'est plus seul.", lyrics: "Before I met you, I was so lost\nAnd no clue what paths will cross.\nThen you showed up, you read my word.\nNow you don't have to say any word.\nI kept thinking, am I good for this?\nAll my fear makes me overthink.\nWhen I wanna give up, you are still there\nAnd you throw my doubts in the air.\n\nYou're the starlight.\nYou are my guide.\nYou gave me the faith, you gave me the strength.\nWhen life is hard I just trust myself.\nI have no regret and no more stress.\nAll I do is to trust myself.\nNo time to spend, no success.\nAll of that cause I trust myself.\nI do not need help, I have you my friend.\nThanks to you I just trust myself.\n\nI became blind, it was in my mind.\nSo hard, I didn't see it behind.\nAll these voices, running through my head.\nSince I know you, I know how to leave them.\nNever believed I was born for this.\nWell, not until I make it.\nIt wasn't my show, but you make me glow.\nSince that day, I'm no longer solo.\n\nYou're the starlight.\nYou are my guide.\nYou gave me the faith, you gave me the strength.\nWhen life is hard I just trust myself.\nI have no regret and no more stress.\nAll I do is to trust myself.\nNo time to spend, no success.\nAll of that cause I trust myself.\nI do not need help, I have you my friend.\nThanks to you I just trust myself.", spotify: "https://open.spotify.com/track/5rz2mycAHJIOax1YJt30IK", bandcamp: "https://raptol.bandcamp.com/track/starlight" },
            { ytID:"m9V8JCu1A44", name: "Midnight Radiance",       duration: "3:20", credits: "Instrumental",     story: "Raptol émerge de la possession — pas indemne, mais libre. La musique rayonne là où elle étouffait. Ce n'est pas la fin, c'est le premier moment depuis The Call où il respire vraiment.", lyrics: "", spotify: "https://open.spotify.com/track/7rx0tAG2hMHiw3AB7FT6Xm", bandcamp: "https://raptol.bandcamp.com/track/midnight-radiance" },
            { ytID:"jG3LZvpvey0", name: "Falling Star",            duration: "4:03", credits: "Voix : Nïx",       story: "La boucle se referme. Raptol regarde en arrière — la possession, les dégâts, le sentiment d'être inutile et destructeur que l'Étoile Rouge avait amplifié. Mais une étoile filante apparaît à nouveau, comme au tout début. Cette fois il sait faire la différence. Il l'attrape. Et pour la première fois il peut se retourner vers les autres et dire : vous aussi, vous pouvez trouver la vôtre.", lyrics: "I was mad, here just for the bad, always been so loud, and nothing felt right.\nI felt so useless, always making a mess, I'm called heartless, despite my kindness.\nIt told me those stories, sometimes life's not that happy.\nDon't worry, I'm not lonely, I see it getting closely.\n\nIt falls from the sky, and now she's mine,\nI thought it was too high, but it was not so far,\nI was looking for a sign, and yet it has arrived,\nThere's nothing to hide, it's my falling star.\n\nIt told me those stories, sometimes life's not that happy.\nDon't worry, I'm not lonely, I see it getting closely.\n\nIt falls from the sky, and now she's mine,\nI thought it was too high, but it was not so far,\nI was looking for a sign, and yet it has arrived,\nThere's nothing to hide, it's my falling star.\n\nI hope you will find that thing from the sky,\nYou think that's a lie, cause you can't see it fly,\nYou may not know why, but you can give it a try,\nYou will fall under the charm of the falling star.\n\nIt falls from the sky, and now she's mine,\nI thought it was too high, but it was not so far,\nI was looking for a sign, and yet it has arrived,\nThere's nothing to hide, it's my falling star.", spotify: "https://open.spotify.com/track/5XKMZbfJgAPahP08cVxttr", bandcamp: "https://raptol.bandcamp.com/track/falling-star" }
        ]
    },
    "THE REVENGE": {
        type: "single", badge: "Single",
        color: "#ff4444", size: 28, orbitRadius: 600, parentName: "STARLIGHT", moonOrbit: 180,
        listenUrl: "https://distrokid.com/hyperfollow/raptol/the-revenge",
        description: "Face B de l'affrontement. Un son brut et immédiat.",
        tracks: [
            {
                name: "The Revenge",
                duration: "4:12",
                credits: "Voix : Nïx",
                story: "Raptol affronte une figure toxique de son passé — quelqu'un qui avait autrefois un pouvoir destructeur sur ceux qui l'entouraient. Des pauses de guitare électrique entrecoupées de synthétiseurs, avec une rupture au piano qui crée un moment de vulnérabilité avant de replonger dans les ténèbres. Malgré tout, le protagoniste choisit de ne pas se laisser consumer par la vengeance.",
                lyrics: "",
                clip: "https://youtu.be/4qbmo2r0gJ4",
                spotify: "https://open.spotify.com/track/34vROsj9cclzeMj08OmJcO",
                bandcamp: "https://raptol.bandcamp.com/track/the-revenge-2"
            }
        ]
    },
    "ULONIA": {
        type: "album", badge: "Album",
        color: "#00ff88", size: 80, orbitRadius: 1050,
        ytPlaylist: "OLAK5uy_lOmsuK6znx70xBvvBOSFS_7HVutS-86fU",
        listenUrl: "https://open.spotify.com/artist/5iZwGnQHKkWgjg9ygj",
        description: "Découverte d'une civilisation oubliée dans les profondeurs minérales.",
        tracks: [
            { ytID:"ZNFiO3rpm5w", name: "Legend of Gennaro",     duration: "", credits: "Voix-off", lyrics: "The legend I am about to tell you\nbegins in a small village in Scotland\ncalled Pittenweem.\n\nGennaro,\na young man like any other,\ntook his boat and set out to sea as usual\nto go and do some fishing.\n\nWhen he had finished,\nhe started to head for his harbour\nso that he could return home,\n\nbut the sky darkened,\nand Gennaro could not see\nwhere he was heading to.\n\nSuddenly\na strong light appeared directly\nfrom the sky above him\nand he fainted.\n\nWhen he woke up,\nGennaro found himself in a place\nthat was unlike anything\nhe knew on earth,\n\nthe grass was dark blue,\nthe sky was red\nand the climate was humid.\n\nAll at once,\nhe saw a figure in the distance\napproaching him.\n\nAs it approached, he saw clearly\nthat it was not a human\nbut a creature from which\nhe could not determine the origin.\n\nThis creature approached Gennaro\nand explained to him\nthat he had been kidnapped by Xonyar,\nan evil monster who collects human souls\nto increase his power,\n\nand that there was only one way out:\nto travel through the wastelands\nto find Xonyar's hideout\nand strike him down\nin order to recover his soul.\n\nGennaro decided to brave the challenge\nand set out to find Xonyar's hideout\nin order to strike him down\nand recover his soul.", story: "Introduction de l'album. Une voix-off pose le décor : Gennaro, jeune pêcheur écossais du village de Pittenweem, disparaît en mer dans une lumière aveuglante. Il se réveille dans un monde inconnu — l'herbe bleue, le ciel rouge, un air lourd et humide. Une créature étrange lui révèle la vérité : il a été kidnappé par Xonyar, un monstre qui collecte les âmes humaines pour accroître sa puissance. Il n'existe qu'une seule issue — traverser les terres dévastées, trouver le repaire de Xonyar et le vaincre pour récupérer son âme. Gennaro accepte le défi.", spotify: "https://open.spotify.com/artist/5iZwGnQHKkWgjg9ygj", bandcamp: "https://raptol.bandcamp.com/track/legend-of-gennaro" },
            { ytID:"yPVqk73TrYw", name: "The Start",             duration: "", credits: "Instrumental", lyrics: "", story: "La narration s'achève. Gennaro se retrouve seul face à un horizon infini de terres inconnues sous un ciel cramoisi. La créature lui a indiqué une direction — c'est tout. Aucune arme, aucune carte, aucune certitude. Seulement la nécessité d'avancer. Il pose un premier pas sur l'herbe bleue sombre, et le voyage commence. Va-t-il survivre assez longtemps pour même apercevoir le domaine de Xonyar ?" },
            { ytID:"Uq4VQMX2tx4", name: "Confusion",             duration: "", credits: "Instrumental", lyrics: "", story: "Le paysage se dérobe sans cesse sous les pieds de Gennaro. Sous le ciel rouge, les chemins semblent se refermer sur eux-mêmes, les distances sont impossibles à évaluer, et l'air humide joue des tours à l'esprit. Il commence à douter — avance-t-il vraiment, ou tourne-t-il en rond depuis des heures ? Ce monde obéit à des règles qu'il ne comprend pas. Est-il condamné à errer sans fin dans ce labyrinthe alien, ou existe-t-il un chemin à travers le chaos ?" },
            { ytID:"So71NFBV0hU", name: "Lake of Lost Souls",    duration: "", credits: "Instrumental", lyrics: "", story: "Gennaro atteint le bord d'un lac immense aux eaux noires comme le vide. La créature l'avait prévenu : les âmes capturées par Xonyar dérivent ici, piégées entre deux mondes. Des murmures montent des profondeurs — des voix qui implorent Gennaro de s'arrêter, de se reposer, de les rejoindre dans leur sommeil éternel. La traversée semble impossible. Trouvera-t-il la force de longer le lac des âmes perdues sans se laisser consumer par leur appel ?" },
            { ytID:"QSNL1EW6Dho", name: "Determination",         duration: "", credits: "Instrumental", lyrics: "", story: "Épuisé, transi, loin de tout ce qu'il connaît, Gennaro s'effondre. Le poids de la mission l'écrase. La créature, son village, la mer d'Écosse — tout cela semble appartenir à une autre vie. Mais quelque chose refuse de s'éteindre au fond de lui — la mémoire de ce qu'il est, de ce que Xonyar lui a volé. Il se relève. La partie la plus sombre du voyage l'attend peut-être encore, mais Gennaro a pris sa décision : il n'abandonnera pas." },
            { ytID:"WgNRW8CoZms", name: "Bravery",               duration: "", credits: "Instrumental", lyrics: "", story: "Les premiers gardiens de Xonyar font leur apparition — des créatures monstrueuses qui patrouillent les terres dévastées. Gennaro n'a aucune arme, aucune armure, aucune expérience du combat. Seulement du courage. Il leur fait face quand même. Débordé et à court de forces, il s'en sort de justesse — mais il sait désormais que le chemin vers Xonyar exigera bien plus que de la bravoure. Le danger n'a fait que commencer." },
            { ytID:"BcSkQ4o-i_8", name: "The Fortress",          duration: "", credits: "Instrumental", lyrics: "", story: "À l'horizon cramoisi, une forteresse colossale de pierre noire se dresse au-dessus du paysage alien. C'est le repaire de Xonyar — l'endroit où les âmes volées sont gardées prisonnières. Elle est entourée de défenses en couches successives, et aucun passage évident n'apparaît. Gennaro fixe la forteresse depuis le lointain, stupéfait par sa démesure. Comment un simple pêcheur pourrait-il jamais briser une telle citadelle ?" },
            { ytID:"r1cPYTxQJ_g", name: "Maze",                  duration: "", credits: "Instrumental", lyrics: "", story: "Entre Gennaro et la forteresse s'étend un labyrinthe sans fin — des couloirs de cristal et de pierre qui s'étendent dans toutes les directions, vivants de pièges et de faux-semblants. Des heures passent. Peut-être des jours. Les murs semblent se déplacer. Chaque carrefour ressemble au précédent. Quelque part au centre de ce dédale se trouve la salle du trône où siège Xonyar. Gennaro y arrivera-t-il, ou s'égarera-t-il dans ces couloirs de cristal jusqu'à épuisement total ?" },
            { ytID:"79IaSgGX2JE", name: "Xonyar",                duration: "", credits: "Instrumental", lyrics: "", story: "Après ce qui semble une éternité, Gennaro émerge dans une vaste salle du trône. Et là, entouré d'orbes flottants de lumière volée — chacun une âme piégée — se trouve Xonyar. Le monstre tourne lentement son regard vers lui. L'air devient glacial. Des milliers d'âmes l'observent en silence. Gennaro a enfin trouvé Xonyar — mais il est seul, sans arme, et totalement impréparé à ce qui se tient devant lui." },
            { ytID:"eXfH7g8nZj8", name: "Critical State",        duration: "", credits: "Instrumental", lyrics: "", story: "La confrontation est brève et brutale. Xonyar écrase Gennaro avec une facilité déconcertante, le projetant sur la pierre froide de la forteresse. Le corps cède. La conscience s'efface. Gennaro gît immobile sur le sol, plus proche de la mort que jamais. La créature, qui l'avait suivi de loin, le récupère de justesse avant que Xonyar ne l'achève. Dans cet état critique, inconscient et vaincu, une question plane sur tout : est-ce la fin de l'histoire de Gennaro ?" },
            { ytID:"fPQLqJazQtg", name: "Gennaro's Training",    duration: "", credits: "Instrumental", lyrics: "", story: "Gennaro se réveille dans le repaire de la créature, à peine vivant. La préparation sérieuse commence : la créature lui enseigne la discipline, le contrôle, comment canaliser l'énergie de ce monde alien en force. Chaque exercice dépasse les limites de ce que Gennaro croyait possible. Mais pour la première fois depuis qu'il a ouvert les yeux dans ce monde, il commence à entrevoir une chance réelle. L'entraînement est impitoyable — mais est-ce suffisant pour affronter Xonyar ?" },
            { ytID:"JYi3fOIgW7s", name: "Gennaro's Training II", duration: "", credits: "Instrumental", lyrics: "", story: "Les séances s'intensifient. Gennaro repousse chaque limite, forgant corps et esprit en quelque chose capable d'affronter Xonyar. La créature lui révèle enfin la seule faiblesse du monstre — un bref instant de vulnérabilité dans le combat, une fenêtre infime qu'il faudra saisir au bon moment. Gennaro a tout absorbé. Son regard a changé. Il est prêt. Le combat final l'attend." },
            { ytID:"l4CzZM6RLqo", name: "Final Battle",          duration: "", credits: "Instrumental", lyrics: "", story: "Gennaro retourne dans la forteresse et affronte Xonyar pour la dernière fois. Le combat est long et dévastateur. Chaque technique apprise, chaque gramme de détermination, chaque cicatrice gagnée sur le chemin — tout converge vers cet instant unique. La forteresse tremble. Les orbes d'âmes volées scintillent dans la pénombre. Le destin de Gennaro et de chaque âme piégée dans cette salle du trône repose sur ce seul moment." },
            { ytID:"PiCHg_u6-6s", name: "Outer Wilds",           duration: "", credits: "Instrumental", lyrics: "", story: "La forteresse s'effondre. Les âmes volées sont libérées, se dispersant comme de la lumière dans le ciel alien. Gennaro se tient dans les décombres, son propre âme enfin rendue, entière. Il retrouve son chemin à travers le labyrinthe, longe le lac, traverse les terres dévastées — et, d'une manière impossible à expliquer, revient à la surface. La mer d'Écosse l'attend quelque part au-delà de l'horizon. Il est libre.", spotify: "https://open.spotify.com/artist/5iZwGnQHKkWgjg9ygj", bandcamp: "https://raptol.bandcamp.com/track/outer-wilds" }
        ]
    }
};

// Met à jour le lien "Dernière Sortie" avec le nom de la dernière release
(function updateNavReleaseLink() {
    const latest = Object.values(ALBUM_DATA).find(a => a.badge && a.badge.includes('Nouveau'))
                || Object.values(ALBUM_DATA)[0];
    const el = document.getElementById('nav-release-link');
    if (el && latest) el.textContent = latest.tracks[0]?.name || latest.badge;
})();

function toTitleCase(str) {
    if (!str) return '';
    return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// ─────────────────────────────────────────────
// 2. GALAXY BACKGROUND (2D canvas)
// ─────────────────────────────────────────────
const canvas2D = document.getElementById('starfield');
const ctx = canvas2D.getContext('2d');
let W = 0, H = 0;
let stars2D = [];
let mouse2D = { x: 0, y: 0 };
let galaxy2DTime = 0;
let warpProgress  = 0;   // 0 = normal, 1 = full hyperspace
let isWarping     = false;
const STAR_COUNT  = 3800;

// Star color palette: white-blue, blue, yellow-white, orange, warm-white
const STAR_COLORS = [
    [255, 255, 255], [220, 235, 255], [180, 210, 255],
    [255, 250, 210], [255, 230, 150], [255, 200, 130],
    [200, 220, 255], [255, 255, 240]
];

function resize2D() {
    W = canvas2D.width  = window.innerWidth;
    H = canvas2D.height = window.innerHeight;
}

class Star2D {
    constructor() { this.init(true); }
    init(scatter = false) {
        this.x    = (Math.random() - 0.5) * W * 3.2;
        this.y    = (Math.random() - 0.5) * H * 3.2;
        this.z    = scatter ? Math.random() * W : W;
        this.sz   = Math.random() < 0.12 ? Math.random() * 2.2 + 1.4   // bright star
                  : Math.random() * 1.2 + 0.3;                           // dim star
        const ci  = Math.floor(Math.random() * STAR_COLORS.length);
        this.rgb  = STAR_COLORS[ci];
        // Twinkle: random phase & speed
        this.twPhase = Math.random() * Math.PI * 2;
        this.twSpeed = 0.3 + Math.random() * 1.2;
        this.bright  = this.sz > 1.4; // big stars get a glow halo
    }
    update(warpP) {
        // At warpP=1 stars move ~55x faster
        const boost = 1 + Math.pow(warpP, 1.6) * 54;
        this.z -= 5 * (this.sz * 0.35 + 0.45) * boost;
        if (this.z <= 0) this.init();
    }
    draw(t, warpP) {
        const s  = W / this.z;
        const px = (this.x / this.z) * W + W / 2 + mouse2D.x * s * 0.025 * (1 - warpP);
        const py = (this.y / this.z) * H + H / 2 + mouse2D.y * s * 0.025 * (1 - warpP);
        const r  = Math.max((1 - this.z / W) * this.sz, 0.2);
        if (px < -60 || px > W + 60 || py < -60 || py > H + 60) return;

        if (warpP < 0.05) {
            // ── Normal star ──
            const twinkle = 0.65 + 0.35 * Math.sin(t * this.twSpeed + this.twPhase);
            if (this.bright && r > 0.8) {
                const [rr, gg, bb] = this.rgb;
                const glow = ctx.createRadialGradient(px, py, 0, px, py, r * 4.5);
                glow.addColorStop(0,   `rgba(${rr},${gg},${bb},${0.45 * twinkle})`);
                glow.addColorStop(0.4, `rgba(${rr},${gg},${bb},${0.15 * twinkle})`);
                glow.addColorStop(1,   `rgba(${rr},${gg},${bb},0)`);
                ctx.beginPath();
                ctx.arc(px, py, r * 4.5, 0, Math.PI * 2);
                ctx.fillStyle = glow;
                ctx.fill();
            }
            const [rr, gg, bb] = this.rgb;
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${rr},${gg},${bb},${twinkle})`;
            ctx.fill();
        } else {
            // ── Hyperspace streak ──
            // Direction from screen center to star = radial outward
            const dx = px - W * 0.5;
            const dy = py - H * 0.5;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 1) return;

            // Tail: pulls back toward center proportionally to warp speed
            const stretch = Math.pow(warpP, 0.7) * 0.30;
            const tailX = px - dx * stretch;
            const tailY = py - dy * stretch;

            // Color blends to white as warp increases
            const [rr, gg, bb] = this.rgb;
            const w = warpP * 0.85;
            const cr = Math.min(255, Math.round(rr + (255 - rr) * w));
            const cg = Math.min(255, Math.round(gg + (255 - gg) * w));
            const cb = Math.min(255, Math.round(bb + (235 - bb) * w * 0.8));

            const alpha = Math.min(warpP * 2.5, 1) * 0.95;
            const lw    = r * (0.7 + warpP * 1.8);

            const grad = ctx.createLinearGradient(tailX, tailY, px, py);
            grad.addColorStop(0,   `rgba(${cr},${cg},${cb},0)`);
            grad.addColorStop(0.6, `rgba(${cr},${cg},${cb},${alpha * 0.5})`);
            grad.addColorStop(1,   `rgba(${cr},${cg},${cb},${alpha})`);

            ctx.lineWidth   = lw;
            ctx.strokeStyle = grad;
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(px, py);
            ctx.stroke();
        }
    }
}

const PLANET_DEFS = [
    { name: 'DARKEST DREAMS', color: '#e8000a', color2: '#1a0000', type: 'lava',    minR: 14, maxR: 26 },
    { name: 'VIRGO',          color: '#00f0ff', color2: '#0044aa', type: 'gas',     minR: 12, maxR: 24 },
    { name: 'STARLIGHT',      color: '#ffd700', color2: '#cc5500', type: 'ringed',  minR: 22, maxR: 40 },
    { name: 'THE REVENGE',    color: '#ff4444', color2: '#550000', type: 'rocky',   minR:  8, maxR: 16 },
    { name: 'ULONIA',      color: '#00ff88', color2: '#003322', type: 'mineral', minR: 14, maxR: 28 },
];

let planets2D = [];
let hoveredPlanet2D = null;
let alien2D = null; // rare easter egg
let planetThumbsReady = false;
let _galaxyRafId = null; // tracks current tickGalaxy RAF to prevent duplicates
let _alienCooldown = 0;  // frames remaining before alien can spawn again

class Planet2D {
    constructor(def) {
        this.name   = def.name;
        this.color  = def.color;
        this.color2 = def.color2;
        this.type   = def.type;
        this.minR   = def.minR;
        this.maxR   = def.maxR;
        this.reset(true);
    }
    reset(initial = false) {
        this.x  = (Math.random() - 0.5) * W * 1.5;
        this.y  = (Math.random() - 0.5) * H * 1.5;
        this.z  = initial ? Math.random() * W * 8 : W * 16;
        this.r  = Math.random() * (this.maxR - this.minR) + this.minR;
        // Deterministic surface detail offsets (stable per spawn)
        this.seed = Math.random() * 1000;
    }
    update() {
        this.z -= 14;
        if (this.z <= -80) this.reset();
    }
    draw() {
        if (this.z <= 0) return;
        const s  = W / this.z;
        const px = (this.x / this.z) * W + W / 2;
        const py = (this.y / this.z) * H + H / 2;
        const r  = this.r * s;
        if (r < 1) return;
        const mx = mouse2D.x + W / 2;
        const my = mouse2D.y + H / 2;
        const hovered = Math.hypot(px - mx, py - my) < r + 4;
        if (hovered) hoveredPlanet2D = this;

        ctx.save();

        if (this.thumbCanvas) {
            // ── 3D-accurate thumbnail from the real WebGL shader ──
            const drawR = this.thumbIsRinged ? r * 2.6 : r;

            // Atmospheric glow
            const glowR = r * 2.5;
            const glow = ctx.createRadialGradient(px, py, r * 0.4, px, py, glowR);
            glow.addColorStop(0, this.color + '30');
            glow.addColorStop(1, 'transparent');
            ctx.beginPath(); ctx.arc(px, py, glowR, 0, Math.PI * 2);
            ctx.fillStyle = glow; ctx.fill();

            if (this.thumbIsRinged) {
                // Ringed planet: draw full thumbnail (rings included), no clip
                ctx.drawImage(this.thumbCanvas, px - drawR, py - drawR, drawR * 2, drawR * 2);
            } else {
                // Regular planet: clip to circle
                ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.clip();
                ctx.drawImage(this.thumbCanvas, px - r, py - r, r * 2, r * 2);
            }
        } else {
            // ── Fallback procedural while thumbnail not yet captured ──
            const glowR = r * 2.4;
            const glow = ctx.createRadialGradient(px, py, r * 0.6, px, py, glowR);
            glow.addColorStop(0, this.color + '28');
            glow.addColorStop(1, 'transparent');
            ctx.beginPath(); ctx.arc(px, py, glowR, 0, Math.PI * 2);
            ctx.fillStyle = glow; ctx.fill();

            if (this.type === 'ringed') this._drawRings(px, py, r, false);

            const lit = ctx.createRadialGradient(px - r * 0.35, py - r * 0.35, r * 0.05, px + r * 0.15, py + r * 0.15, r * 1.1);
            lit.addColorStop(0,    this.color);
            lit.addColorStop(0.4,  this.color);
            lit.addColorStop(0.78, this.color2);
            lit.addColorStop(1,    '#000000');
            ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fillStyle = lit; ctx.fill();

            if (r > 4) {
                if (this.type === 'mineral') this._drawMineral(px, py, r);
                if (this.type === 'gas')     this._drawGasBands(px, py, r);
                if (this.type === 'rocky')   this._drawCraters(px, py, r);
            }

            const atmo = ctx.createRadialGradient(px, py, r * 0.88, px, py, r * 1.18);
            atmo.addColorStop(0,   'transparent');
            atmo.addColorStop(0.5, this.color + '1a');
            atmo.addColorStop(1,   'transparent');
            ctx.beginPath(); ctx.arc(px, py, r * 1.18, 0, Math.PI * 2);
            ctx.fillStyle = atmo; ctx.fill();

            if (this.type === 'ringed') this._drawRings(px, py, r, true);
        }

        // Hover label
        if (hovered) {
            const yOff = (this.thumbIsRinged || this.type === 'ringed') ? r * 2.8 : r * 1.4;
            ctx.restore(); ctx.save();
            ctx.font = `${Math.max(10, r * 0.65)}px 'Major Mono Display', monospace`;
            ctx.fillStyle = 'rgba(255,255,255,0.92)';
            ctx.textAlign = 'center';
            ctx.fillText(toTitleCase(this.name), px, py - yOff);
        }

        ctx.restore();
    }

    _drawRings(px, py, r, front) {
        const rx = r * 2.05;
        const ry = r * 0.32;
        ctx.save();
        ctx.globalAlpha = 0.52;
        const rGrad = ctx.createLinearGradient(px - rx, py, px + rx, py);
        rGrad.addColorStop(0,    'transparent');
        rGrad.addColorStop(0.12, this.color + '77');
        rGrad.addColorStop(0.38, this.color + 'bb');
        rGrad.addColorStop(0.5,  this.color + 'dd');
        rGrad.addColorStop(0.62, this.color + 'bb');
        rGrad.addColorStop(0.88, this.color + '77');
        rGrad.addColorStop(1,    'transparent');
        ctx.strokeStyle = rGrad;
        ctx.lineWidth = r * 0.28;
        ctx.beginPath();
        // front = lower half (over the planet), back = upper half (behind)
        ctx.ellipse(px, py, rx, ry, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    _drawMineral(px, py, r) {
        // Crystal/mineral patches — deterministic from seed
        ctx.save();
        ctx.beginPath(); ctx.arc(px, py, r * 0.97, 0, Math.PI * 2); ctx.clip();
        ctx.globalAlpha = 0.28;
        const s = this.seed;
        for (let i = 0; i < 6; i++) {
            const ox = (((s * (i + 1) * 137) % 100) / 100 - 0.5) * r * 1.5;
            const oy = (((s * (i + 1) * 97)  % 100) / 100 - 0.5) * r * 1.5;
            const or = r * (0.1 + (i % 3) * 0.08);
            ctx.beginPath(); ctx.arc(px + ox, py + oy, or, 0, Math.PI * 2);
            ctx.fillStyle = i % 2 === 0 ? '#001a0d' : '#00cc55';
            ctx.fill();
        }
        ctx.restore();
    }

    _drawGasBands(px, py, r) {
        ctx.save();
        ctx.beginPath(); ctx.arc(px, py, r * 0.97, 0, Math.PI * 2); ctx.clip();
        ctx.globalAlpha = 0.22;
        // Horizontal bands offset from planet center
        const bandData = [
            { dy: -r * 0.38, h: r * 0.14, col: 'rgba(0,180,220,1)'  },
            { dy:  r * 0.05, h: r * 0.10, col: 'rgba(0,120,180,1)'  },
            { dy:  r * 0.40, h: r * 0.12, col: 'rgba(0,200,240,1)'  },
        ];
        for (const b of bandData) {
            ctx.fillStyle = b.col;
            ctx.fillRect(px - r, py + b.dy, r * 2, b.h);
        }
        ctx.restore();
    }

    _drawCraters(px, py, r) {
        ctx.save();
        ctx.beginPath(); ctx.arc(px, py, r * 0.97, 0, Math.PI * 2); ctx.clip();
        const s = this.seed;
        for (let i = 0; i < 5; i++) {
            const ox = (((s * (i + 3) * 73) % 100) / 100 - 0.5) * r * 1.3;
            const oy = (((s * (i + 3) * 53) % 100) / 100 - 0.5) * r * 1.3;
            const or = r * (0.08 + (i % 3) * 0.09);
            // Dark crater
            ctx.globalAlpha = 0.45;
            ctx.beginPath(); ctx.arc(px + ox, py + oy, or, 0, Math.PI * 2);
            ctx.fillStyle = '#330000';
            ctx.fill();
            // Rim highlight
            ctx.globalAlpha = 0.18;
            ctx.strokeStyle = '#ff8866';
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.arc(px + ox, py + oy, or, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }
}

// ── Alien UFO easter egg (very rare) ──
class Alien2D {
    constructor() {
        this.side  = Math.random() < 0.5 ? 1 : -1; // 1 = enters from left, -1 from right
        this.x     = this.side > 0 ? -140 : W + 140;
        this.y     = H * (0.12 + Math.random() * 0.55);
        this.speed = (1.8 + Math.random() * 2.2) * this.side;
        this.r     = 16 + Math.random() * 10;
        this.wobble = Math.random() * Math.PI * 2;
        this.beamOn = false;
        this.beamTimer = 0;
        this.done  = false;
    }
    update() {
        this.x += this.speed;
        this.wobble += 0.038;
        this.y += Math.sin(this.wobble) * 0.4;
        this.beamTimer += 0.016;
        // Randomly toggle beam every few seconds
        if (this.beamTimer > 2.5 + Math.random() * 2 && Math.random() < 0.04) {
            this.beamOn = !this.beamOn;
            this.beamTimer = 0;
        }
        if (this.x < -220 || this.x > W + 220) this.done = true;
    }
    draw() {
        const { x, y, r } = this;
        ctx.save();

        // Beam of light (below saucer)
        if (this.beamOn) {
            const beamH = H - y + 20;
            const bw = r * 0.85;
            const bGrad = ctx.createLinearGradient(x, y + r * 0.35, x, y + r * 0.35 + beamH);
            bGrad.addColorStop(0,   'rgba(120,255,180,0.18)');
            bGrad.addColorStop(0.3, 'rgba(120,255,180,0.06)');
            bGrad.addColorStop(1,   'rgba(120,255,180,0)');
            ctx.beginPath();
            ctx.moveTo(x - bw, y + r * 0.35);
            ctx.lineTo(x + bw, y + r * 0.35);
            ctx.lineTo(x + bw * 2.8, y + r * 0.35 + beamH);
            ctx.lineTo(x - bw * 2.8, y + r * 0.35 + beamH);
            ctx.closePath();
            ctx.fillStyle = bGrad;
            ctx.fill();
        }

        // Subtle outer glow
        const outerGlow = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 2.2);
        outerGlow.addColorStop(0,   'rgba(80,255,140,0.08)');
        outerGlow.addColorStop(0.5, 'rgba(80,255,140,0.03)');
        outerGlow.addColorStop(1,   'transparent');
        ctx.beginPath(); ctx.ellipse(x, y, r * 2.2, r * 1.0, 0, 0, Math.PI * 2);
        ctx.fillStyle = outerGlow; ctx.fill();

        // Saucer disc body
        const discGrad = ctx.createRadialGradient(x - r * 0.2, y - r * 0.08, r * 0.05, x, y + r * 0.1, r * 1.05);
        discGrad.addColorStop(0,   '#aaffcc');
        discGrad.addColorStop(0.4, '#33cc77');
        discGrad.addColorStop(0.8, '#116633');
        discGrad.addColorStop(1,   '#002211');
        ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.28, 0, 0, Math.PI * 2);
        ctx.fillStyle = discGrad; ctx.fill();

        // Dome (upper half-ellipse)
        const domeGrad = ctx.createRadialGradient(x - r * 0.12, y - r * 0.32, 0, x, y - r * 0.1, r * 0.46);
        domeGrad.addColorStop(0,   'rgba(200,255,230,0.95)');
        domeGrad.addColorStop(0.55,'rgba(60,180,110,0.85)');
        domeGrad.addColorStop(1,   'rgba(0,60,30,0.8)');
        ctx.beginPath(); ctx.ellipse(x, y - r * 0.12, r * 0.40, r * 0.30, 0, Math.PI, 0);
        ctx.fillStyle = domeGrad; ctx.fill();

        // Rotating rim lights
        const numL = 7;
        for (let i = 0; i < numL; i++) {
            const angle = (i / numL) * Math.PI * 2 + galaxy2DTime * 2.5;
            const lx = x + Math.cos(angle) * r * 0.74;
            const ly = y + Math.sin(angle) * r * 0.22;
            const hue = (galaxy2DTime * 80 + i * (360 / numL)) % 360;
            ctx.beginPath(); ctx.arc(lx, ly, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${hue},100%,75%,0.95)`;
            ctx.fill();
        }

        ctx.restore();
    }
}

function initGalaxy() {
    // Cancel any existing RAF loop before starting a new one — prevents duplicate accumulation
    if (_galaxyRafId !== null) {
        cancelAnimationFrame(_galaxyRafId);
        _galaxyRafId = null;
    }
    // Preserve captured thumbnails across resize — no need to re-capture
    const savedThumbs = {};
    planets2D.forEach(p => {
        if (p.thumbCanvas) savedThumbs[p.name] = { thumbCanvas: p.thumbCanvas, thumbIsRinged: p.thumbIsRinged };
    });
    stars2D = [];
    planets2D = [];
    alien2D = null;
    for (let i = 0; i < STAR_COUNT; i++) stars2D.push(new Star2D());
    PLANET_DEFS.forEach(def => {
        const p = new Planet2D(def);
        if (savedThumbs[def.name]) { p.thumbCanvas = savedThumbs[def.name].thumbCanvas; p.thumbIsRinged = savedThumbs[def.name].thumbIsRinged; }
        planets2D.push(p);
    });
    if (SYSTEM_STATE.mode === '2D') tickGalaxy();
}

async function capturePlanetThumbs() {
    planetThumbsReady = true; // prevent re-entry
    if (!SS.renderer || SS.bodies.length === 0) return;

    const SIZE = 256;
    const rt = new THREE.WebGLRenderTarget(SIZE, SIZE, {
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
    });

    const thumbCam = new THREE.PerspectiveCamera(36, 1, 0.1, 500000);
    const thumbScene = new THREE.Scene();

    // Save & override clear color for transparent background
    const prevColor = new THREE.Color();
    const prevAlpha = SS.renderer.getClearAlpha();
    SS.renderer.getClearColor(prevColor);
    SS.renderer.setClearColor(0x000000, 0);

    // Planet is placed far from world origin (0,0,0 = star/sun position).
    // sunDir = normalize(-vWorldPos) → placing planet at (-D*0.6, 0, -D*0.8) gives
    // 37° front-right illumination on the camera-facing face.
    const D = 80000;
    const planetPos = new THREE.Vector3(-D * 0.6, 0, -D * 0.8);

    for (const body of SS.bodies) {
        if (!body.mesh || body.data.type === 'star') continue;

        const origPos    = body.mesh.position.clone();
        const origParent = body.mesh.parent;
        const origRot    = body.mesh.rotation.clone();

        body.mesh.position.copy(planetPos);
        body.mesh.rotation.set(0, 0, 0);
        thumbScene.add(body.mesh);

        // Zoom out enough to frame rings for ringed planets
        const isRinged = !!body.ringUniforms;
        const viewHalf = isRinged
            ? (body.ringUniforms.uOuterR?.value ?? body.data.size) * 1.2
            : body.data.size * 1.15;
        const dist = viewHalf / Math.tan(18 * Math.PI / 180);

        // For ringed planets: tilt camera 22° above equatorial plane so rings show
        const tiltAngle = isRinged ? 22 * Math.PI / 180 : 0;
        const camOffset = new THREE.Vector3(
            0,
            dist * Math.sin(tiltAngle),
            dist * Math.cos(tiltAngle)
        );
        thumbCam.position.copy(planetPos).add(camOffset);
        thumbCam.lookAt(planetPos);

        const camWorldPos = thumbCam.position.clone();
        if (body.planetUniforms) {
            body.planetUniforms.uTime.value = 0.5;
            body.planetUniforms.uCameraPos.value.copy(camWorldPos);
        }
        if (body.ringUniforms) body.ringUniforms.uTime.value = 0.5;

        SS.renderer.setRenderTarget(rt);
        SS.renderer.clear();
        SS.renderer.render(thumbScene, thumbCam);
        SS.renderer.setRenderTarget(null);

        // Read & flip Y (WebGL is bottom-up)
        const raw    = new Uint8Array(SIZE * SIZE * 4);
        SS.renderer.readRenderTargetPixels(rt, 0, 0, SIZE, SIZE, raw);
        const flipped = new Uint8ClampedArray(SIZE * SIZE * 4);
        for (let y = 0; y < SIZE; y++) {
            flipped.set(
                raw.subarray((SIZE - 1 - y) * SIZE * 4, (SIZE - y) * SIZE * 4),
                y * SIZE * 4
            );
        }

        const tc = document.createElement('canvas');
        tc.width = tc.height = SIZE;
        tc.getContext('2d').putImageData(new ImageData(flipped, SIZE, SIZE), 0, 0);

        thumbScene.remove(body.mesh);
        if (origParent) origParent.add(body.mesh);
        body.mesh.position.copy(origPos);
        body.mesh.rotation.copy(origRot);

        const p2d = planets2D.find(p => p.name === body.key);
        if (p2d) { p2d.thumbCanvas = tc; p2d.thumbIsRinged = isRinged; }
    }

    SS.renderer.setClearColor(prevColor, prevAlpha);
    rt.dispose();
}

// Draw a faint Milky Way band across the sky
function drawNebulaLayer() {
    // Diagonal band — soft glow across the canvas
    const cx = W * 0.5, cy = H * 0.5;
    const bands = [
        { x: cx - W * 0.15, y: cy + H * 0.12, rx: W * 0.95, ry: H * 0.18, a: 0.028, col: '80,60,130' },
        { x: cx + W * 0.08, y: cy - H * 0.08, rx: W * 0.70, ry: H * 0.12, a: 0.020, col: '40,60,130' },
        { x: cx - W * 0.25, y: cy - H * 0.30, rx: W * 0.50, ry: H * 0.22, a: 0.018, col: '60,30,100' },
    ];
    for (const b of bands) {
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, Math.max(b.rx, b.ry));
        g.addColorStop(0,   `rgba(${b.col},${b.a})`);
        g.addColorStop(0.5, `rgba(${b.col},${b.a * 0.4})`);
        g.addColorStop(1,   `rgba(${b.col},0)`);
        ctx.save();
        ctx.scale(b.rx / Math.max(b.rx, b.ry), b.ry / Math.max(b.rx, b.ry));
        ctx.beginPath();
        ctx.arc(
            b.x * Math.max(b.rx, b.ry) / b.rx,
            b.y * Math.max(b.rx, b.ry) / b.ry,
            Math.max(b.rx, b.ry), 0, Math.PI * 2
        );
        ctx.fillStyle = g;
        ctx.fill();
        ctx.restore();
    }
}

function tickGalaxy() {
    if (SYSTEM_STATE.mode !== '2D' && !isWarping) { _galaxyRafId = null; return; }
    _galaxyRafId = requestAnimationFrame(tickGalaxy);
    galaxy2DTime += 0.016;
    hoveredPlanet2D = null;

    // Background: darken toward pure black during warp
    const bg = isWarping
        ? `rgb(${Math.round(3 * (1 - warpProgress))},${Math.round(4 * (1 - warpProgress))},${Math.round(10 * (1 - warpProgress))})`
        : '#03040a';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (!isWarping) drawNebulaLayer();
    for (const s of stars2D)   { s.update(warpProgress); s.draw(galaxy2DTime, warpProgress); }
    // Lazily capture planet thumbnails once the 3D system is ready
    if (!planetThumbsReady && SS.renderer && SS.bodies.length > 0) capturePlanetThumbs();
    // Hide planets + alien during warp
    if (!isWarping) {
        for (const p of planets2D) { p.update(); p.draw(); }

        // Easter egg: ~once every 8-15 min, with 6-min cooldown after each appearance
        if (!alien2D && _alienCooldown <= 0 && Math.random() < 0.000008) {
            alien2D = new Alien2D();
            _alienCooldown = 60 * 60 * 6; // 6-min cooldown at ~60fps
        }
        if (_alienCooldown > 0) _alienCooldown--;
        if (alien2D) {
            alien2D.update();
            alien2D.draw();
            if (alien2D.done) alien2D = null;
        }
    }
    canvas2D.style.cursor = hoveredPlanet2D ? 'pointer' : 'default';
}

window.addEventListener('mousemove', e => {
    mouse2D.x = e.clientX - W / 2;
    mouse2D.y = e.clientY - H / 2;
});

canvas2D.addEventListener('click', () => {
    if (hoveredPlanet2D) openSolarAndZoom(hoveredPlanet2D.name);
});

function buildSoftSpriteTexture(colorHex) {
    const S = 64;
    const oc = document.createElement('canvas');
    oc.width = oc.height = S;
    const c = oc.getContext('2d');
    const grad = c.createRadialGradient(S/2, S/2, 0, S/2, S/2, S/2);
    grad.addColorStop(0, colorHex);
    grad.addColorStop(0.3, colorHex);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = grad;
    c.fillRect(0, 0, S, S);
    const tex = new THREE.CanvasTexture(oc);
    tex.needsUpdate = true;
    return tex;
}

function buildNormalMap(colorHex) {
    const S = 64;
    const oc  = document.createElement('canvas');
    oc.width = oc.height = S;
    const c = oc.getContext('2d');
    const img = c.createImageData(S, S);
    const d = img.data;
    const seed = (parseInt(colorHex.slice(1,3), 16) % 97) * 0.1;

    for (let py = 0; py < S; py++) {
        for (let px = 0; px < S; px++) {
            const nx = px / S + seed, ny = py / S + seed;
            const val = Math.sin(nx * 15) * Math.cos(ny * 15) * 0.5 + 0.5;
            const valX = Math.sin((px+1)/S * 15) * Math.cos(ny * 15) * 0.5 + 0.5;
            const valY = Math.sin(nx * 15) * Math.cos((py+1)/S * 15) * 0.5 + 0.5;

            const dx = (val - valX) * 2;
            const dy = (val - valY) * 2;
            const len = Math.sqrt(dx*dx + dy*dy + 1);
            const idx = (py*S+px)*4;
            d[idx]   = Math.floor((dx/len * 0.5 + 0.5) * 255);
            d[idx+1] = Math.floor((dy/len * 0.5 + 0.5) * 255);
            d[idx+2] = Math.floor((1/len  * 0.5 + 0.5) * 255);
            d[idx+3] = 255;
        }
    }
    c.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(oc);
    tex.needsUpdate = true;
    return tex;
}


// ─────────────────────────────────────────────
// 3. CUSTOM SHADERS
// ─────────────────────────────────────────────

// Shared Fresnel vertex shader (normal + world pos)
const FRESNEL_VERTEX = `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Animated Sun Shader — realistic plasma surface
const SunShaderMaterial = {
    vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vPosition;

        // ── Simplex 3D noise ──
        vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
            const vec2 C = vec2(1.0/6.0, 1.0/3.0);
            const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
            vec3 i  = floor(v + dot(v, C.yyy));
            vec3 x0 = v - i + dot(i, C.xxx);
            vec3 g  = step(x0.yzx, x0.xyz);
            vec3 l  = 1.0 - g;
            vec3 i1 = min(g.xyz, l.zxy);
            vec3 i2 = max(g.xyz, l.zxy);
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy;
            vec3 x3 = x0 - D.yyy;
            i = mod289(i);
            vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
            float n_ = 0.142857142857;
            vec3 ns = n_ * D.wyz - D.xzx;
            vec4 j  = p - 49.0 * floor(p * ns.z * ns.z);
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_);
            vec4 x  = x_ * ns.x + ns.yyyy;
            vec4 y  = y_ * ns.x + ns.yyyy;
            vec4 h  = 1.0 - abs(x) - abs(y);
            vec4 b0 = vec4(x.xy, y.xy);
            vec4 b1 = vec4(x.zw, y.zw);
            vec4 s0 = floor(b0)*2.0 + 1.0;
            vec4 s1 = floor(b1)*2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
            vec3 p0 = vec3(a0.xy, h.x);
            vec3 p1 = vec3(a0.zw, h.y);
            vec3 p2 = vec3(a1.xy, h.z);
            vec3 p3 = vec3(a1.zw, h.w);
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
            p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
            vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
        }

        // 4-octave FBM
        float fbm(vec3 p) {
            float f = 0.0;
            f += 0.5000 * snoise(p); p *= 2.02;
            f += 0.2500 * snoise(p); p *= 2.03;
            f += 0.1250 * snoise(p); p *= 2.01;
            f += 0.0625 * snoise(p);
            return f / 0.9375;
        }

        void main() {
            vec3 sp = normalize(vPosition);

            // ── Layer A: large plasma cells (slow) ──
            float tA = uTime * 0.08;
            float A  = fbm(sp * 7.0 + vec3(tA, -tA*1.2, tA*0.5));

            // ── Layer B: medium convection (medium speed) ──
            float tB = uTime * 0.20;
            float B  = fbm(sp * 16.0 + vec3(tB*0.7, -tB, tB*0.45));

            float noise = A * 0.65 + B * 0.35;
            float n = clamp(noise + 0.50, 0.0, 1.0);

            // ── Fire palette ──
            vec3 c0 = vec3(0.32, 0.02, 0.00);
            vec3 c1 = vec3(0.82, 0.15, 0.00);
            vec3 c2 = vec3(1.00, 0.46, 0.00);
            vec3 c3 = vec3(1.00, 0.78, 0.03);
            vec3 c4 = vec3(1.00, 0.97, 0.74);

            vec3 col;
            if      (n < 0.25) col = mix(c0, c1, n * 4.0);
            else if (n < 0.50) col = mix(c1, c2, (n - 0.25) * 4.0);
            else if (n < 0.75) col = mix(c2, c3, (n - 0.50) * 4.0);
            else               col = mix(c3, c4, (n - 0.75) * 4.0);

            // ── Limb darkening ──
            float cosV = max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0);
            float limb = 0.30 + 0.70 * pow(cosV, 0.40);
            col *= limb;

            gl_FragColor = vec4(col, 1.0);
        }
    `
};

// ── Planet Shader System ───────────────────────────────────────────────────────

// Common vertex shader: world-space normal + position for lighting, local dir for noise
const PLANET_VERT = `
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;
    varying vec3 vLocalDir;
    void main() {
        vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        vWorldPos    = (modelMatrix * vec4(position, 1.0)).xyz;
        vLocalDir    = normalize(position);
        gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Shared noise block (snoise + 6-octave FBM) — inserted into each planet fragment shader
const NOISE_GLSL = `
    vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
    float snoise(vec3 v){
        const vec2 C=vec2(1.0/6.0,1.0/3.0);
        const vec4 D=vec4(0.0,0.5,1.0,2.0);
        vec3 i=floor(v+dot(v,C.yyy));
        vec3 x0=v-i+dot(i,C.xxx);
        vec3 g=step(x0.yzx,x0.xyz);
        vec3 l=1.0-g;
        vec3 i1=min(g.xyz,l.zxy);
        vec3 i2=max(g.xyz,l.zxy);
        vec3 x1=x0-i1+C.xxx;
        vec3 x2=x0-i2+C.yyy;
        vec3 x3=x0-D.yyy;
        i=mod289(i);
        vec4 p=permute(permute(permute(
            i.z+vec4(0.0,i1.z,i2.z,1.0))
            +i.y+vec4(0.0,i1.y,i2.y,1.0))
            +i.x+vec4(0.0,i1.x,i2.x,1.0));
        float n_=0.142857142857;
        vec3 ns=n_*D.wyz-D.xzx;
        vec4 j=p-49.0*floor(p*ns.z*ns.z);
        vec4 x_=floor(j*ns.z);
        vec4 y_=floor(j-7.0*x_);
        vec4 x=x_*ns.x+ns.yyyy;
        vec4 y=y_*ns.x+ns.yyyy;
        vec4 h=1.0-abs(x)-abs(y);
        vec4 b0=vec4(x.xy,y.xy);
        vec4 b1=vec4(x.zw,y.zw);
        vec4 s0=floor(b0)*2.0+1.0;
        vec4 s1=floor(b1)*2.0+1.0;
        vec4 sh=-step(h,vec4(0.0));
        vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
        vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
        vec3 p0=vec3(a0.xy,h.x);
        vec3 p1=vec3(a0.zw,h.y);
        vec3 p2=vec3(a1.xy,h.z);
        vec3 p3=vec3(a1.zw,h.w);
        vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
        p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
        vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
        m=m*m;
        return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
    }
    float fbm(vec3 p){
        float f=0.0;
        f+=0.5000*snoise(p);p*=2.02;
        f+=0.2500*snoise(p);p*=2.03;
        f+=0.1250*snoise(p);p*=2.01;
        f+=0.0625*snoise(p);
        return f/0.9375;
    }
`;

// ── ULONIA: red-sky ocean world — blue seas, rusty land, red-orange atmosphere ──
const UloniaShader = {
    vertexShader: PLANET_VERT,
    fragmentShader: `
        uniform float uTime;
        uniform vec3 uCameraPos;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPos;
        varying vec3 vLocalDir;
    ` + NOISE_GLSL + `
        void main() {
            vec3 sp = vLocalDir;
            float t = uTime * 0.05;

            // Large-scale terrain: ocean vs land
            float land1   = fbm(sp * 2.1 + vec3(t*0.30, t*0.12, 0.0));
            float land2   = fbm(sp * 5.5 + vec3(t*0.18, 0.0, t*0.14));
            float terrain = land1*0.65 + land2*0.35;
            float isOcean = smoothstep(0.06, -0.06, terrain);

            // Ocean: deep navy → mid blue → shallow azure
            float od = fbm(sp * 8.5 + vec3(t*0.45, t*0.55, 0.0)) * 0.5 + 0.5;
            vec3 deepO  = vec3(0.02, 0.06, 0.48);
            vec3 midO   = vec3(0.04, 0.22, 0.72);
            vec3 shalO  = vec3(0.08, 0.42, 0.85);
            vec3 oceanCol = (od < 0.5) ? mix(deepO, midO, od*2.0) : mix(midO, shalO, (od-0.5)*2.0);

            // Land: dark volcanic red → rust → bright ochre
            float lv = fbm(sp * 4.8 + vec3(0.5, t*0.20, 1.2)) * 0.5 + 0.5;
            vec3 darkR  = vec3(0.24, 0.06, 0.02);
            vec3 rustL  = vec3(0.55, 0.17, 0.04);
            vec3 brightR= vec3(0.72, 0.32, 0.10);
            vec3 landCol = (lv < 0.5) ? mix(darkR, rustL, lv*2.0) : mix(rustL, brightR, (lv-0.5)*2.0);

            // Polar ice caps
            float ice = smoothstep(0.65, 0.80, abs(sp.y));
            vec3 iceCol = vec3(0.82, 0.93, 0.98);

            vec3 surface = mix(landCol, oceanCol, isOcean);
            surface = mix(surface, iceCol, ice);

            // Lighting: sun at world origin
            vec3 sunDir = normalize(-vWorldPos);
            float NdotL = max(0.0, dot(vWorldNormal, sunDir));
            surface *= 0.06 + 0.94 * NdotL;

            // Red-orange atmosphere fresnel (the red sky)
            vec3 viewDir = normalize(uCameraPos - vWorldPos);
            float fres   = pow(1.0 - max(0.0, dot(viewDir, vWorldNormal)), 3.0) * 1.2;
            vec3 atmDay   = vec3(1.00, 0.22, 0.04);
            vec3 atmNight = vec3(0.35, 0.04, 0.01);
            surface += mix(atmNight, atmDay, NdotL*0.7+0.3) * fres * 1.4;

            gl_FragColor = vec4(surface, 1.0);
        }
    `
};

// ── STARLIGHT: orange/green gas giant — horizontal banded bands ──
const StarlightShader = {
    vertexShader: PLANET_VERT,
    fragmentShader: `
        uniform float uTime;
        uniform vec3 uCameraPos;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPos;
        varying vec3 vLocalDir;
    ` + NOISE_GLSL + `
        void main() {
            vec3 sp = vLocalDir;
            float t = uTime * 0.025;

            // Latitude bands with FBM warp for turbulence
            float warp = fbm(sp * vec3(0.8, 2.5, 0.8) + vec3(t*0.18, 0.0, t*0.12)) * 0.28;
            float lat  = sp.y + warp;
            float large = sin(lat *  9.0 * 3.14159) * 0.5 + 0.5;
            float fine  = sin(lat * 23.0 * 3.14159) * 0.5 + 0.5;
            float bands = large*0.65 + fine*0.35;

            float turb = fbm(sp * 12.0 + vec3(t*0.55, t*0.28, t*0.42)) * 0.5 + 0.5;
            bands = clamp(bands + (turb - 0.5) * 0.18, 0.0, 1.0);

            // Belt → orange → cream → green → belt
            vec3 belt   = vec3(0.46, 0.18, 0.04);
            vec3 orange = vec3(0.91, 0.46, 0.08);
            vec3 cream  = vec3(0.91, 0.78, 0.44);
            vec3 green  = vec3(0.24, 0.58, 0.17);

            vec3 col;
            if      (bands < 0.25) col = mix(belt,   orange, bands*4.0);
            else if (bands < 0.50) col = mix(orange, cream,  (bands-0.25)*4.0);
            else if (bands < 0.75) col = mix(cream,  green,  (bands-0.50)*4.0);
            else                   col = mix(green,  belt,   (bands-0.75)*4.0);

            // Polar darkening
            col *= 1.0 - smoothstep(0.72, 1.0, abs(sp.y)) * 0.42;

            // Lighting
            vec3 sunDir = normalize(-vWorldPos);
            float NdotL = max(0.0, dot(vWorldNormal, sunDir));
            col *= 0.08 + 0.92 * NdotL;

            // Warm orange-golden atmosphere fresnel
            vec3 viewDir = normalize(uCameraPos - vWorldPos);
            float fres   = pow(1.0 - max(0.0, dot(viewDir, vWorldNormal)), 2.5);
            col += vec3(0.88, 0.52, 0.10) * fres * (0.15 + 0.85*NdotL) * 0.82;

            gl_FragColor = vec4(col, 1.0);
        }
    `
};

// ── THE REVENGE: black obsidian world — near-void with dark purple veins ──
const TheRevengeShader = {
    vertexShader: PLANET_VERT,
    fragmentShader: `
        uniform float uTime;
        uniform vec3 uCameraPos;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPos;
        varying vec3 vLocalDir;
    ` + NOISE_GLSL + `
        void main() {
            vec3 sp = vLocalDir;
            float t = uTime * 0.04;

            float n1 = fbm(sp * 4.2 + vec3(t*0.10, t*0.16, 0.0));
            float n2 = fbm(sp * 11.0 + vec3(0.0, t*0.20, t*0.13));
            float n3 = fbm(sp * 22.0 + vec3(t*0.08, 0.0, t*0.11));
            float n  = clamp(n1*0.55 + n2*0.30 + n3*0.15 + 0.5, 0.0, 1.0);

            // Near-black obsidian with deep purple veins
            vec3 void_  = vec3(0.005, 0.002, 0.012);
            vec3 dark   = vec3(0.055, 0.022, 0.090);
            vec3 mid    = vec3(0.130, 0.050, 0.200);
            vec3 vein   = vec3(0.200, 0.072, 0.325);

            vec3 col;
            if      (n < 0.35) col = mix(void_, dark, n/0.35);
            else if (n < 0.70) col = mix(dark,  mid,  (n-0.35)/0.35);
            else               col = mix(mid,   vein, (n-0.70)/0.30);

            // Very dark shadow side
            vec3 sunDir = normalize(-vWorldPos);
            float NdotL = max(0.0, dot(vWorldNormal, sunDir));
            col *= 0.02 + 0.98 * NdotL;

            // Faint dark-violet limb glow
            vec3 viewDir = normalize(uCameraPos - vWorldPos);
            float fres   = pow(1.0 - max(0.0, dot(viewDir, vWorldNormal)), 4.0);
            col += vec3(0.28, 0.04, 0.50) * fres * NdotL * 0.45;

            gl_FragColor = vec4(col, 1.0);
        }
    `
};

// ── DARKEST DREAMS: fractured obsidian — near-void with crimson lava veins ──
const DarkestDreamsShader = {
    vertexShader: PLANET_VERT,
    fragmentShader: `
        uniform float uTime;
        uniform vec3 uCameraPos;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPos;
        varying vec3 vLocalDir;
    ` + NOISE_GLSL + `
        void main() {
            vec3 sp = vLocalDir;
            float t = uTime * 0.025;

            float n1 = fbm(sp * 3.2 + vec3(t*0.07, t*0.11, 0.0));
            float n2 = fbm(sp * 8.5  + vec3(0.0, t*0.14, t*0.09));
            float n3 = fbm(sp * 20.0 + vec3(t*0.05, 0.0, t*0.08));
            float n  = clamp(n1*0.55 + n2*0.30 + n3*0.15 + 0.5, 0.0, 1.0);

            // Near-black obsidian with deep crimson lava cracks
            vec3 void_  = vec3(0.006, 0.000, 0.000);
            vec3 dark   = vec3(0.030, 0.003, 0.003);
            vec3 crack  = vec3(0.200, 0.012, 0.008);
            vec3 lava   = vec3(0.520, 0.035, 0.012);

            vec3 col;
            if      (n < 0.38) col = mix(void_, dark,  n / 0.38);
            else if (n < 0.70) col = mix(dark,  crack, (n - 0.38) / 0.32);
            else               col = mix(crack, lava,  (n - 0.70) / 0.30);

            // Harsh lighting — very dark shadow side
            vec3 sunDir = normalize(-vWorldPos);
            float NdotL = max(0.0, dot(vWorldNormal, sunDir));
            col *= 0.02 + 0.98 * NdotL;

            // Blood red limb glow — heat emanating from within
            vec3 viewDir = normalize(uCameraPos - vWorldPos);
            float fres   = pow(1.0 - max(0.0, dot(viewDir, vWorldNormal)), 3.2);
            col += vec3(0.60, 0.018, 0.008) * fres * 0.65;

            gl_FragColor = vec4(col, 1.0);
        }
    `
};

// ── VIRGO: deep beautiful blue — swirling sapphire gas world ──
const VirgoShader = {
    vertexShader: PLANET_VERT,
    fragmentShader: `
        uniform float uTime;
        uniform vec3 uCameraPos;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPos;
        varying vec3 vLocalDir;
    ` + NOISE_GLSL + `
        void main() {
            vec3 sp = vLocalDir;
            float t = uTime * 0.04;

            // Three swirl layers at different scales
            float s1 = fbm(sp * 2.6  + vec3(t*0.12,  t*0.08, t*0.10));
            float s2 = fbm(sp * 6.0  + vec3(t*0.28, -t*0.16, t*0.20));
            float s3 = fbm(sp * 12.5 + vec3(t*0.52,  t*0.38,-t*0.24));
            float n  = clamp(s1*0.50 + s2*0.33 + s3*0.17 + 0.5, 0.0, 1.0);

            // Navy → sapphire → electric blue → ice white
            vec3 navy     = vec3(0.01, 0.04, 0.30);
            vec3 sapphire = vec3(0.03, 0.18, 0.68);
            vec3 electric = vec3(0.08, 0.50, 0.96);
            vec3 ice      = vec3(0.68, 0.86, 1.00);

            vec3 col;
            if      (n < 0.33) col = mix(navy,     sapphire, n/0.33);
            else if (n < 0.66) col = mix(sapphire, electric, (n-0.33)/0.33);
            else               col = mix(electric, ice,      (n-0.66)/0.34);

            // Lighting
            vec3 sunDir = normalize(-vWorldPos);
            float NdotL = max(0.0, dot(vWorldNormal, sunDir));
            col *= 0.07 + 0.93 * NdotL;

            // Strong vivid-blue atmosphere fresnel
            vec3 viewDir = normalize(uCameraPos - vWorldPos);
            float fres   = pow(1.0 - max(0.0, dot(viewDir, vWorldNormal)), 2.2);
            vec3 atmDay   = vec3(0.12, 0.52, 1.00);
            vec3 atmNight = vec3(0.02, 0.08, 0.38);
            col += mix(atmNight, atmDay, NdotL*0.6+0.4) * fres * 1.1;

            gl_FragColor = vec4(col, 1.0);
        }
    `
};

// ── Ring shader for Starlight ──
const RingShader = {
    vertexShader: `
        varying vec3 vWorldPos;
        varying vec3 vLocalPos;
        void main() {
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            vLocalPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uInnerR;
        uniform float uOuterR;
        uniform float uTime;
        varying vec3 vWorldPos;
        varying vec3 vLocalPos;

        void main() {
            // RingGeometry lies in XY plane in local space
            float dist = length(vLocalPos.xy);
            float r = (dist - uInnerR) / (uOuterR - uInnerR);
            if (r < 0.0 || r > 1.0) discard;

            // Multi-scale ring bands (Cassini-style)
            float b1 = sin(r * 62.0 * 3.14159) * 0.5 + 0.5;
            float b2 = sin(r * 26.0 * 3.14159) * 0.5 + 0.5;
            float b3 = sin(r *  9.0 * 3.14159) * 0.5 + 0.5;
            float bands = b1*0.50 + b2*0.32 + b3*0.18;

            // Cassini division gap at r≈0.50
            bands *= 1.0 - smoothstep(0.04, 0.0, abs(r - 0.50));

            // Edge fade
            bands *= smoothstep(0.0, 0.06, r) * smoothstep(1.0, 0.92, r);
            if (bands < 0.015) discard;

            // Warm gold → amber → tan gradient outward
            vec3 inner = vec3(0.92, 0.76, 0.38);
            vec3 mid   = vec3(0.78, 0.58, 0.26);
            vec3 outer = vec3(0.58, 0.40, 0.18);
            vec3 col   = (r < 0.5) ? mix(inner, mid, r*2.0) : mix(mid, outer, (r-0.5)*2.0);

            // Sun lighting (rough approximation for flat ring)
            vec3 sunDir = normalize(-vWorldPos);
            col *= max(0.15, abs(sunDir.y) * 0.7 + 0.35);

            gl_FragColor = vec4(col, bands * 0.90);
        }
    `
};

// ── Solar Eruption Arc System ──────────────────────────────────────────────────
class SolarEruption {
    constructor(sunMesh, sunRadius) {
        // Random surface point
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.acos(2 * Math.random() - 1);
        const startDir = new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta),
            Math.sin(phi) * Math.sin(theta),
            Math.cos(phi)
        );

        // End point: nearby on surface (arc spread 0.3–0.9 radians)
        const spread = 0.3 + Math.random() * 0.6;
        const perp = new THREE.Vector3(
            -(startDir.y + startDir.z),
            startDir.x,
            startDir.x
        ).normalize();
        const angle = (Math.random() - 0.5) * spread * 2;
        const endDir = startDir.clone()
            .applyAxisAngle(perp, angle)
            .normalize();

        const r = sunRadius;
        const startPt = startDir.clone().multiplyScalar(r);
        const endPt   = endDir.clone().multiplyScalar(r);

        // Control point: midpoint direction, elevated 12–35% of radius
        const midDir = startDir.clone().add(endDir).normalize();
        const height = r * (0.12 + Math.random() * 0.23);
        const ctrlPt = midDir.clone().multiplyScalar(r + height);

        // Bezier curve → tube geometry
        const curve   = new THREE.QuadraticBezierCurve3(startPt, ctrlPt, endPt);
        const tubeSeg = 20;
        const tubeRad = r * 0.007 + Math.random() * r * 0.004; // slender plasma thread
        const geo     = new THREE.TubeGeometry(curve, tubeSeg, tubeRad, 5, false);

        // Shader: UV.x goes 0→1 along tube — animate grow head & fade tail
        const mat = new THREE.ShaderMaterial({
            uniforms: {
                uHead: { value: 0.0 }, // leading edge (grows 0→1)
                uTail: { value: 0.0 }, // trailing edge (fades 0→1 during shrink)
            },
            vertexShader: `
                varying float vU;
                varying float vV;
                void main() {
                    vU = uv.x;
                    vV = uv.y;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uHead;
                uniform float uTail;
                varying float vU;
                varying float vV;
                void main() {
                    if (vU > uHead || vU < uTail) discard;
                    float headFade = smoothstep(uHead, uHead - 0.08, vU);
                    float tailFade = smoothstep(uTail, uTail + 0.08, vU);
                    float alpha = headFade * tailFade;
                    float edge = abs(vV * 2.0 - 1.0);
                    float core = 1.0 - edge * edge;
                    float arcBright = sin(vU * 3.14159);
                    vec3 cBase = vec3(1.0, 0.18, 0.0);
                    vec3 cPeak = vec3(1.0, 0.85, 0.2);
                    vec3 col = mix(cBase, cPeak, arcBright * 0.8);
                    float brightness = (0.5 + core * 0.7) * alpha;
                    gl_FragColor = vec4(col * brightness * 2.2, alpha * brightness);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
        });

        this.mesh = new THREE.Mesh(geo, mat);
        sunMesh.add(this.mesh);
        this.mat = mat;

        // Timing (seconds)
        this.growDur   = 1.2 + Math.random() * 1.0;
        this.holdDur   = 0.4 + Math.random() * 1.2;
        this.shrinkDur = 1.0 + Math.random() * 0.8;
        this.phase     = 'grow';
        this.t         = 0;
        this.done      = false;
    }

    update(dt) {
        this.t += dt;
        const u = this.mat.uniforms;

        if (this.phase === 'grow') {
            u.uHead.value = Math.min(this.t / this.growDur, 1.0);
            if (this.t >= this.growDur) { this.t = 0; this.phase = 'hold'; }

        } else if (this.phase === 'hold') {
            u.uHead.value = 1.0;
            u.uTail.value = 0.0;
            if (this.t >= this.holdDur) { this.t = 0; this.phase = 'shrink'; }

        } else if (this.phase === 'shrink') {
            u.uTail.value = Math.min(this.t / this.shrinkDur, 1.0);
            if (this.t >= this.shrinkDur) { this.done = true; }
        }
    }

    dispose() {
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
    }
}

// Solar prominence shader — fragment-only, limb jets (no vertex displacement)
const ProminenceShader = {
    vertexShader: FRESNEL_VERTEX,
    fragmentShader: `
        uniform float uTime;
        uniform vec3  uCameraPos;
        varying vec3  vNormal;
        varying vec3  vWorldPosition;

        vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
        vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
        vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
        float snoise(vec3 v){
            const vec2 C=vec2(1.0/6.0,1.0/3.0);
            const vec4 D=vec4(0.0,0.5,1.0,2.0);
            vec3 i=floor(v+dot(v,C.yyy));
            vec3 x0=v-i+dot(i,C.xxx);
            vec3 g=step(x0.yzx,x0.xyz);
            vec3 l=1.0-g;
            vec3 i1=min(g.xyz,l.zxy);
            vec3 i2=max(g.xyz,l.zxy);
            vec3 x1=x0-i1+C.xxx;
            vec3 x2=x0-i2+C.yyy;
            vec3 x3=x0-D.yyy;
            i=mod289(i);
            vec4 p=permute(permute(permute(
                i.z+vec4(0.0,i1.z,i2.z,1.0))
                +i.y+vec4(0.0,i1.y,i2.y,1.0))
                +i.x+vec4(0.0,i1.x,i2.x,1.0));
            float n_=0.142857142857;
            vec3 ns=n_*D.wyz-D.xzx;
            vec4 j=p-49.0*floor(p*ns.z*ns.z);
            vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
            vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy;
            vec4 h=1.0-abs(x)-abs(y);
            vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
            vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0;
            vec4 sh=-step(h,vec4(0.0));
            vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
            vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
            vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y);
            vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
            vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
            p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
            vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
            m=m*m;
            return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
        }

        void main() {
            // Fresnel — how tangential is this surface to the viewer?
            vec3 viewDir = normalize(uCameraPos - vWorldPosition);
            float cosA = max(dot(viewDir, vNormal), 0.0);
            float edge = 1.0 - cosA; // 0 = face-on, 1 = limb

            // Only render near the limb (where jets would poke out against space)
            float limbIn  = smoothstep(0.48, 0.70, edge);
            float limbOut = 1.0 - smoothstep(0.85, 1.0, edge);
            float limb = limbIn * limbOut;
            if (limb < 0.01) discard;

            // Animated noise — two layers: slow location + fast flicker
            vec3 pos = vWorldPosition * 0.0045;
            float t = uTime;
            float n1 = snoise(pos + vec3(t*0.20, -t*0.32, t*0.14));
            float n2 = snoise(pos * 3.5 + vec3(t*0.58, -t*0.82, t*0.38));
            float n = n1 * 0.55 + n2 * 0.45;
            n = n * 0.5 + 0.5;           // remap to [0,1]
            n = pow(n, 2.8);              // sharpen into distinct jets

            float intensity = n * limb;
            if (intensity < 0.35) discard;   // only keep bright jet peaks, eliminate dark halo

            // Colour: vivid orange → yellow-white hot tip
            vec3 col_base = vec3(1.0, 0.35, 0.0);
            vec3 col_tip  = vec3(1.0, 0.95, 0.45);
            vec3 color = mix(col_base, col_tip, pow(n, 0.5));

            gl_FragColor = vec4(color * 3.5, intensity * 0.95);
        }
    `
};

const AtmosphereShaderMaterial = {
    vertexShader: FRESNEL_VERTEX,
    fragmentShader: `
        uniform vec3 uColor;
        uniform float uIntensity;
        uniform vec3 uCameraPos;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
            vec3 viewDir = normalize(uCameraPos - vWorldPosition);
            float cosAngle = max(dot(viewDir, vNormal), 0.0);
            float edge = 1.0 - cosAngle;

            // Hair-thin limb — only visible at extreme grazing angles
            float rim = pow(edge, 8.0) * uIntensity;

            // Pure planet color at the edge, no blue tint override
            vec3 finalColor = uColor;

            float alpha = clamp(rim * 0.6, 0.0, 1.0);
            gl_FragColor = vec4(finalColor, alpha);
        }
    `
};

const CoronaShaderMaterial = {
    vertexShader: FRESNEL_VERTEX,
    fragmentShader: `
        uniform float uTime;
        uniform vec3 uCameraPos;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
            vec3 viewDir = normalize(uCameraPos - vWorldPosition);
            float cosAngle = max(dot(viewDir, vNormal), 0.0);
            float f = 1.0 - cosAngle;

            float pulse = 1.0 + sin(uTime * 1.1) * 0.04;

            // Barely-there warm white corona — stays at the very limb
            vec3 color = vec3(1.0, 0.92, 0.78) * pulse;

            // Very tight falloff — only a thin ring right at the star edge
            float alpha = pow(f, 4.0) * 0.28 * pulse;
            gl_FragColor = vec4(color, alpha);
        }
    `
};


// ─────────────────────────────────────────────
// 4. 3D SOLAR SYSTEM ENGINE
// ─────────────────────────────────────────────
let SS = {
    scene: null, camera: null, renderer: null,
    controls: null, frameId: null,
    bodies: [],
    interactives: [],
    raycaster: new THREE.Raycaster(),
    pointer: new THREE.Vector2(),
    state: 'system',
    focused: null,
    _zoomRaf: null,
};

function makeOrbitLine(radius, color) {
    const pts = 200;
    const geo = new THREE.BufferGeometry();
    const verts = new Float32Array((pts + 1) * 3);
    for (let i = 0; i <= pts; i++) {
        const a = (i / pts) * Math.PI * 2;
        verts[i*3]   = Math.cos(a) * radius;
        verts[i*3+1] = 0;
        verts[i*3+2] = Math.sin(a) * radius;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.2 });
    return new THREE.Line(geo, mat);
}

let poiMarkers    = []; // { el, body, localPos, idx }
let activePOIIdx  = null;
let _activePOIBody = null;
let _rpBackdrop   = null; // set by injectRegionCSS IIFE
let _rpPanel      = null;
let _sidebarEl    = null;

class SpaceBody {
    constructor(key, data, parentBody = null) {
        this.key      = key;
        this.data     = data;
        this.parent   = parentBody;
        this.angle    = Math.random() * Math.PI * 2;
        this.orbitSpeed = parentBody
            ? (0.003 + Math.random() * 0.004) * (Math.random() > 0.5 ? 1 : -1)
            : 0;

        const segments = data.type === 'star' ? 64 : 48;
        const geo  = new THREE.SphereGeometry(data.size, segments, segments * 0.75 | 0);
        this.mesh  = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x111111 }));
        this.mesh.userData.body = this;
        SS.scene.add(this.mesh);

        if (data.type !== 'star') {
            SS.interactives.push(this.mesh);
        }

        if (parentBody) {
            this.orbitLine = makeOrbitLine(data.orbitRadius, data.color);
            SS.scene.add(this.orbitLine);
        } else {
            this.orbitLine = null;
        }

        this.poiPositions = (data.tracks && data.tracks.length)
            ? this._spreadPOIs(data.tracks.length, data.size)
            : [];
    }

    async initTextures() {
        const data = this.data;
        const texMap = TEXTURE_MAP[this.key];

        if (data.type === 'star') {
            await this._initStarPremium(texMap);
        } else {
            await this._initPlanetPremium(texMap);
        }
    }

    async _initStarPremium(texMap) {
        const data = this.data;

        // Load real sun texture
        let sunTex;
        try {
            sunTex = await loadRealTexture(texMap.diffuse);
        } catch(e) {
            sunTex = await getTextureAsync(data.color, 'star');
        }
        sunTex.wrapS = sunTex.wrapT = THREE.RepeatWrapping;

        // Custom shader material for animated plasma
        this.sunUniforms = {
            uTime: { value: 0 },
        };

        this.mesh.material = new THREE.ShaderMaterial({
            uniforms: this.sunUniforms,
            vertexShader: SunShaderMaterial.vertexShader,
            fragmentShader: SunShaderMaterial.fragmentShader,
        });

        // Point light
        this.light = new THREE.PointLight(0xfff0cc, 5, 18000);
        this.light.castShadow = false;
        this.mesh.add(this.light);

        // Secondary warm fill light
        const fillLight = new THREE.PointLight(0xffe0a0, 2, 9000);
        this.mesh.add(fillLight);

        // Single barely-there glow — warmth only, no halo
        const glowLayers = [
            { scale: 1.6, color: 0xffe8a0, opacity: 0.10 },
        ];
        this.glowSprites = [];
        const glowTex = buildSoftSpriteTexture('rgba(255,90,20,1.0)');
        for (const layer of glowLayers) {
            const mat = new THREE.SpriteMaterial({
                map: glowTex, color: layer.color,
                transparent: true, blending: THREE.AdditiveBlending,
                opacity: layer.opacity, depthWrite: false,
            });
            const sprite = new THREE.Sprite(mat);
            const sz = data.size * layer.scale;
            sprite.scale.set(sz, sz, 1);
            this.mesh.add(sprite);
            this.glowSprites.push({ sprite, baseScale: sz, opacity: layer.opacity });
        }
        // Keep a reference to the outermost for occlusion
        this.glowSprite = this.glowSprites[this.glowSprites.length - 1].sprite;

        // Solar prominences — fragment-only limb jets on a slightly larger sphere
        // Prominence sphere disabled — sun fire surface provides the live effect
        this.prominenceUniforms = null;
        this.prominence = null;

        // Expand lights to match larger sun
        this.light.distance = 28000;
        this.light.intensity = 7;
    }

    async _initPlanetPremium(texMap) {
        const data = this.data;

        // Animated uniforms shared across all planet shaders
        this.planetUniforms = {
            uTime:      { value: 0.0 },
            uCameraPos: { value: new THREE.Vector3() },
        };

        // Per-planet procedural shader
        let shader;
        switch (this.key) {
            case 'ULONIA':          shader = UloniaShader;         break;
            case 'STARLIGHT':       shader = StarlightShader;      break;
            case 'THE REVENGE':     shader = TheRevengeShader;     break;
            case 'VIRGO':           shader = VirgoShader;          break;
            case 'DARKEST DREAMS':  shader = DarkestDreamsShader;  break;
            default:
                this.mesh.material = new THREE.MeshStandardMaterial({ color: new THREE.Color(data.color) });
                return;
        }

        this.mesh.material = new THREE.ShaderMaterial({
            uniforms:       this.planetUniforms,
            vertexShader:   shader.vertexShader,
            fragmentShader: shader.fragmentShader,
        });

        // Add Saturn-style rings to Starlight
        if (this.key === 'STARLIGHT') {
            this._addRings();
        }
    }

    _addRings() {
        const r      = this.data.size;
        const innerR = r * 1.30;
        const outerR = r * 2.35;

        this.ringUniforms = {
            uInnerR: { value: innerR },
            uOuterR: { value: outerR },
            uTime:   { value: 0.0 },
        };

        const ringGeo = new THREE.RingGeometry(innerR, outerR, 180, 4);
        const ringMat = new THREE.ShaderMaterial({
            uniforms:       this.ringUniforms,
            vertexShader:   RingShader.vertexShader,
            fragmentShader: RingShader.fragmentShader,
            transparent:    true,
            side:           THREE.DoubleSide,
            depthWrite:     false,
        });

        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;   // lay flat in equatorial plane
        ring.rotation.z = 0.22;            // slight tilt for visual interest
        this.mesh.add(ring);
    }

    _spreadPOIs(n, radius) {
        const pts = [];
        const golden = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < n; i++) {
            const y = 1 - (i / Math.max(n-1,1)) * 1.2;
            const r = Math.sqrt(Math.max(0, 1 - y * y));
            const theta = golden * i;
            pts.push(new THREE.Vector3(
                Math.cos(theta) * r * radius * 1.02,
                y * radius * 1.02,
                Math.sin(theta) * r * radius * 1.02
            ));
        }
        return pts;
    }

    update() {
        if (this.parent) {
            this.angle += this.orbitSpeed;
            const parentPos = this.parent.mesh.position;
            const orbitR = this.data.orbitRadius;
            this.mesh.position.set(
                parentPos.x + Math.cos(this.angle) * orbitR,
                parentPos.y,
                parentPos.z + Math.sin(this.angle) * orbitR
            );
            if (this.orbitLine && this.parent.key !== 'STAR') {
                this.orbitLine.position.copy(parentPos);
            }
        }
        this.mesh.rotation.y += 0.003;
    }
}

// ─────────────────────────────────────────────
// 5. SOLAR SYSTEM INIT
// ─────────────────────────────────────────────
async function initSolar() {
    if (SS.renderer) return;

    SS.scene = new THREE.Scene();
    SS.camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 1, 60000);
    SS.camera.position.set(0, 1100, 2800);

    SS.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
    SS.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    SS.renderer.setSize(innerWidth, innerHeight);
    SS.renderer.setClearColor(0x03040a, 1);
    SS.renderer.toneMapping = THREE.ReinhardToneMapping;
    SS.renderer.toneMappingExposure = 1.1;
    document.getElementById('solar-system-3d').appendChild(SS.renderer.domElement);

    // Controls
    SS.controls = new THREE.OrbitControls(SS.camera, SS.renderer.domElement);
    SS.controls.enableDamping  = true;
    SS.controls.dampingFactor  = 0.06;
    SS.controls.minDistance    = 30;
    SS.controls.maxDistance    = 25000;

    // Lights
    SS.scene.add(new THREE.AmbientLight(0x1a2040, 0.3));

    // Premium starfield — two layers: dim background + bright foreground
    const addStarLayer = (count, spread, sizeVal, opacity) => {
        const geo = new THREE.BufferGeometry();
        const verts  = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes  = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            verts[i*3]   = (Math.random() - 0.5) * spread;
            verts[i*3+1] = (Math.random() - 0.5) * spread * 0.65;
            verts[i*3+2] = (Math.random() - 0.5) * spread * 1.5;
            const ct = Math.random();
            if (ct < 0.55) {       // blue-white
                colors[i*3]=0.88+Math.random()*0.12; colors[i*3+1]=0.92+Math.random()*0.08; colors[i*3+2]=1.0;
            } else if (ct < 0.75) { // cool blue
                colors[i*3]=0.65; colors[i*3+1]=0.78; colors[i*3+2]=1.0;
            } else if (ct < 0.90) { // yellow-white
                colors[i*3]=1.0; colors[i*3+1]=0.96; colors[i*3+2]=0.72;
            } else if (ct < 0.97) { // orange
                colors[i*3]=1.0; colors[i*3+1]=0.62; colors[i*3+2]=0.28;
            } else {                // red
                colors[i*3]=1.0; colors[i*3+1]=0.30; colors[i*3+2]=0.18;
            }
            sizes[i] = sizeVal * (0.4 + Math.random() * 0.9);
        }
        geo.setAttribute('position', new THREE.BufferAttribute(verts,  3));
        geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
        geo.setAttribute('size',     new THREE.BufferAttribute(sizes,  1));
        // Custom shader so each star gets its own size + soft disc
        const mat = new THREE.ShaderMaterial({
            vertexColors: true,
            transparent: true,
            depthWrite: false,
            uniforms: { uOpacity: { value: opacity } },
            vertexShader: `
                attribute float size;
                varying vec3 vColor;
                void main() {
                    vColor = color;
                    vec4 mv = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (600.0 / -mv.z);
                    gl_Position  = projectionMatrix * mv;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                uniform float uOpacity;
                void main() {
                    float d = length(gl_PointCoord - 0.5) * 2.0;
                    float a = 1.0 - smoothstep(0.0, 1.0, d);
                    a = pow(a, 1.4); // soft disc
                    if (a < 0.01) discard;
                    gl_FragColor = vec4(vColor, a * uOpacity);
                }
            `
        });
        SS.scene.add(new THREE.Points(geo, mat));
    };

    addStarLayer(5000,  26000, 2.2, 0.80);  // dim, distant
    addStarLayer(1500,  18000, 3.8, 0.92);  // medium bright
    addStarLayer(250,   14000, 6.0, 0.95);  // bright foreground stars
    SS.starLayers = SS.scene.children.slice(-3); // keep refs for warp

    // Subtle nebula backdrop (colored point clouds)
    for (let n = 0; n < 3; n++) {
        const nebulaCount = 800;
        const nebGeo = new THREE.BufferGeometry();
        const nebVerts = new Float32Array(nebulaCount * 3);
        const nebColors = new Float32Array(nebulaCount * 3);

        const nebCenter = new THREE.Vector3(
            (Math.random() - 0.5) * 15000,
            (Math.random() - 0.5) * 8000,
            -10000 - Math.random() * 15000
        );
        const nebColor = [
            [0.1, 0.0, 0.3],  // purple
            [0.0, 0.15, 0.3], // blue
            [0.3, 0.05, 0.1], // red
        ][n];

        for (let i = 0; i < nebulaCount; i++) {
            const spread = 3000 + Math.random() * 2000;
            nebVerts[i*3]   = nebCenter.x + (Math.random()-0.5) * spread;
            nebVerts[i*3+1] = nebCenter.y + (Math.random()-0.5) * spread * 0.6;
            nebVerts[i*3+2] = nebCenter.z + (Math.random()-0.5) * spread;

            const intensity = 0.5 + Math.random() * 0.5;
            nebColors[i*3]   = nebColor[0] * intensity;
            nebColors[i*3+1] = nebColor[1] * intensity;
            nebColors[i*3+2] = nebColor[2] * intensity;
        }
        nebGeo.setAttribute('position', new THREE.BufferAttribute(nebVerts, 3));
        nebGeo.setAttribute('color', new THREE.BufferAttribute(nebColors, 3));

        SS.scene.add(new THREE.Points(nebGeo, new THREE.PointsMaterial({
            vertexColors: true, size: 40, sizeAttenuation: true, transparent: true, opacity: 0.15,
            blending: THREE.AdditiveBlending, depthWrite: false,
        })));
    }

    // ── Build bodies ──
    const starData = { type:'star', color:'#ff3300', size:380, orbitRadius:0, tracks:[] };
    const star = new SpaceBody('STAR', starData, null);
    star.mesh.position.set(0, 0, 0);
    SS.bodies.push(star);

    const bodyOrder = ['STARLIGHT', 'ULONIA', 'VIRGO', 'DARKEST DREAMS'];
    for (const key of bodyOrder) {
        const body = new SpaceBody(key, ALBUM_DATA[key], star);
        SS.bodies.push(body);
    }

    const starlight = SS.bodies.find(b => b.key === 'STARLIGHT');
    const revengeData = { ...ALBUM_DATA['THE REVENGE'], orbitRadius: 240, size: 28 };
    const revenge = new SpaceBody('THE REVENGE', revengeData, starlight);
    SS.bodies.push(revenge);

    // Cache star body reference for render loop (avoid find() every frame)
    SS._starBody = SS.bodies.find(b => b.key === 'STAR');

    // Trigger async texture generation (parallel)
    await Promise.all(SS.bodies.map(b => b.initTextures()));

    // ── Interaction Listeners ──
    const throttledHover = throttle(onSolarHover, 50);
    SS.renderer.domElement.addEventListener('click', onSolarClick);
    SS.renderer.domElement.addEventListener('mousemove', throttledHover);

    animateSolar();
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}


// ─────────────────────────────────────────────
// 6. RENDER LOOP
// ─────────────────────────────────────────────
// Pre-allocated temp objects — reused every frame to avoid GC pressure
const _rv1 = new THREE.Vector3();
const _rv2 = new THREE.Vector3();
const _rv3 = new THREE.Vector3();
const _rm1 = new THREE.Matrix4();

let _solarAnimating = false;
function animateSolar() {
    if (SYSTEM_STATE.mode !== '3D') { _solarAnimating = false; return; }
    _solarAnimating = true;
    SS.frameId = requestAnimationFrame(animateSolar);

    const time = performance.now() * 0.001;
    // Shader time: keep small to preserve float32 precision in noise functions
    const shaderTime = time % 1000.0;

    for (const body of SS.bodies) {
        body.update();

        if (body.data.type === 'star') {
            // Update sun shader time
            if (body.sunUniforms) {
                body.sunUniforms.uTime.value = shaderTime;
            }
            // ── Solar eruption arcs ──
            if (!body.eruptions) {
                body.eruptions = [];
                body.nextEruptionIn = 0.5 + Math.random() * 1.5;
                body._lastTime = time;
            }
            const dt = Math.min(time - body._lastTime, 0.1);
            body._lastTime = time;
            body.nextEruptionIn -= dt;
            if (body.nextEruptionIn <= 0 && body.eruptions.length < 3) {
                body.eruptions.push(new SolarEruption(body.mesh, body.data.size));
                body.nextEruptionIn = 1.5 + Math.random() * 3.0;
            }
            for (let i = body.eruptions.length - 1; i >= 0; i--) {
                body.eruptions[i].update(dt);
                if (body.eruptions[i].done) {
                    body.eruptions[i].dispose();
                    body.eruptions.splice(i, 1);
                }
            }
            // Pulsating glow layers
            if (body.glowSprites) {
                const pulse = 1.0 + Math.sin(time * 1.2) * 0.06;
                for (const layer of body.glowSprites) {
                    const sz = layer.baseScale * pulse;
                    layer.sprite.scale.set(sz, sz, 1);
                }
            }
        } else {
            // Update planet shader uniforms each frame
            if (body.planetUniforms) {
                body.planetUniforms.uTime.value = shaderTime;
                body.planetUniforms.uCameraPos.value.copy(SS.camera.position);
            }
            if (body.ringUniforms) {
                body.ringUniforms.uTime.value = shaderTime;
            }
        }
    }

    // Camera follow
    if (SS.state === 'surface' && SS.focused) {
        const planet = SS.focused.mesh;
        planet.updateMatrixWorld();

        if (SS.localCameraOffset) {
            // Reuse _rv1 for world position
            _rv1.copy(SS.localCameraOffset).applyMatrix4(planet.matrixWorld);
            SS.camera.position.copy(_rv1);
        }
        SS.controls.target.copy(planet.position);
    } else if (SS.state === 'system' && SS.focused) {
        SS.controls.target.lerp(SS.focused.mesh.position, 0.07);
    }

    SS.controls.update();

    if (SS.state === 'surface' && SS.focused) {
        // Reuse _rm1 for inverse matrix, _rv2 for local offset — no allocations
        _rm1.copy(SS.focused.mesh.matrixWorld).invert();
        if (!SS.localCameraOffset) SS.localCameraOffset = new THREE.Vector3();
        SS.localCameraOffset.copy(SS.camera.position).applyMatrix4(_rm1);
        updatePOIOverlay();
    }

    // Solar Occlusion Transparency — use cached SS._starBody
    const star = SS._starBody;
    if (star && SS.focused && SS.focused.key !== 'STAR') {
        // Reuse _rv1 = camToPlanet, _rv2 = camToSun, _rv3 = segmentDir / closestPoint
        _rv1.subVectors(SS.focused.mesh.position, SS.camera.position);
        _rv2.subVectors(star.mesh.position, SS.camera.position);
        _rv3.copy(_rv1).normalize(); // segmentDir
        const projLen = _rv2.dot(_rv3);

        let isOccluding = false;
        if (projLen > 0 && projLen < _rv1.length()) {
            _rv3.multiplyScalar(projLen).add(SS.camera.position); // closestPoint
            if (_rv3.distanceTo(star.mesh.position) < star.data.size * 1.2) isOccluding = true;
        }

        if (star.glowSprites) {
            for (const layer of star.glowSprites) {
                layer.sprite.material.opacity = THREE.MathUtils.lerp(
                    layer.sprite.material.opacity,
                    isOccluding ? 0.0 : layer.opacity,
                    0.08
                );
            }
        }
    }

    SS.renderer.render(SS.scene, SS.camera);
}

// ─────────────────────────────────────────────
// 7. INTERACTION — CLICK / HOVER
// ─────────────────────────────────────────────
function getSolarHit(event) {
    const rect = SS.renderer.domElement.getBoundingClientRect();
    SS.pointer.x =  ((event.clientX - rect.left) / rect.width)  * 2 - 1;
    SS.pointer.y = -((event.clientY - rect.top)  / rect.height) * 2 + 1;
    SS.raycaster.setFromCamera(SS.pointer, SS.camera);

    const hits = SS.raycaster.intersectObjects(SS.interactives);
    if (hits.length === 0) return null;

    if (SS.state === 'surface' && SS.focused) {
        const otherHit = hits.find(h => h.object.userData.body && h.object.userData.body !== SS.focused);
        if (otherHit) return otherHit.object.userData.body;
    }

    return hits[0].object.userData.body;
}

let hoverBody = null;
function onSolarHover(event) {
    const rect = SS.renderer.domElement.getBoundingClientRect();
    SS.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    SS.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    SS.raycaster.setFromCamera(SS.pointer, SS.camera);

    const hits = SS.raycaster.intersectObjects(SS.interactives);
    const hit = hits.length > 0 ? hits[0].object.userData.body : null;
    if (hit !== hoverBody) {
        hoverBody = hit;
        const isFocus = SS.state === 'surface' && hit === SS.focused;
        SS.renderer.domElement.style.cursor = (hit && !isFocus) ? 'pointer' : 'crosshair';
    }
}

function onSolarClick(event) {
    const rect = SS.renderer.domElement.getBoundingClientRect();
    SS.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    SS.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    SS.raycaster.setFromCamera(SS.pointer, SS.camera);

    const hits = SS.raycaster.intersectObjects(SS.interactives);
    if (hits.length > 0) {
        const body = hits[0].object.userData.body;
        if (body && body !== SS.focused) {
            zoomToPlanet(body);
        }
    }
}

// ─────────────────────────────────────────────
// 8. ZOOM TO PLANET
// ─────────────────────────────────────────────
function zoomToPlanet(body) {
    // Cancel any in-progress zoom animation
    if (SS._zoomRaf) {
        cancelAnimationFrame(SS._zoomRaf);
        SS._zoomRaf = null;
    }

    SS.controls.enabled = false;

    // Immediately stop animateSolar from overriding camera target
    SS.state = 'transitioning';
    SS.focused = null;
    SS.localCameraOffset = null;

    // Clean up surface UI
    document.getElementById('planet-surface-name').classList.remove('visible');
    document.getElementById('exit-solar').textContent = '← Retour';
    document.getElementById('exit-solar').dataset.state = 'system';
    clearPOIOverlay();
    closePOIPanel();

    const startCamPos = SS.camera.position.clone();
    const startTarget = SS.controls.target.clone();

    const container = SS.renderer.domElement.parentElement;
    if (container) container.classList.add('is-zooming');

    // Compute sun-facing camera destination so planet is always lit
    const planetPos = body.mesh.position.clone();
    const toSun = new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 0), planetPos).normalize();
    const up = Math.abs(toSun.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const right = new THREE.Vector3().crossVectors(toSun, up).normalize();
    const camUp = new THREE.Vector3().crossVectors(right, toSun).normalize();
    const dist = body.data.size * 7.0;
    const desired = planetPos.clone()
        .add(toSun.clone().multiplyScalar(dist * 0.5))
        .add(camUp.clone().multiplyScalar(dist * 0.25));

    let t = 0;
    const tick = () => {
        t = Math.min(t + 0.018, 1);
        // Cubic ease-in-out
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const curPlanetPos = body.mesh.position;
        SS.camera.position.lerpVectors(startCamPos, desired.clone().add(
            curPlanetPos.clone().sub(planetPos)
        ), ease);
        SS.controls.target.lerpVectors(startTarget, curPlanetPos, ease);
        SS.controls.update();

        if (t < 1) {
            SS._zoomRaf = requestAnimationFrame(tick);
        } else {
            SS._zoomRaf = null;
            if (container) container.classList.remove('is-zooming');

            SS.state   = 'surface';
            SS.focused = body;
            SS.controls.enabled = true;
            SS.controls.minDistance = body.data.size * 3.0;
            SS.controls.maxDistance = body.data.size * 30;

            body.mesh.updateMatrixWorld();
            const invMatrix = body.mesh.matrixWorld.clone().invert();
            SS.localCameraOffset = SS.camera.position.clone().applyMatrix4(invMatrix);

            enterSurfaceMode(body);
        }
    };
    SS._zoomRaf = requestAnimationFrame(tick);
}

// ─────────────────────────────────────────────
// 9. SURFACE MODE UI
// ─────────────────────────────────────────────
function enterSurfaceMode(body) {
    document.querySelector('.solar-hud-top').classList.add('visible');

    const nameEl = document.getElementById('planet-surface-name');
    const nameText = body.data.type === 'album'
        ? `${toTitleCase(body.data.badge)} • ${toTitleCase(body.key)}`
        : toTitleCase(body.key);
    nameEl.innerHTML = nameText + '<span id="planet-surface-subtitle"></span>';

    document.getElementById('planet-surface-subtitle').textContent = body.data.type === 'album'
        ? `${body.data.tracks.length} morceaux`
        : 'Single';

    setTimeout(() => nameEl.classList.add('visible'), 100);

    setTimeout(() => {
        document.getElementById('exit-solar').textContent = '← Retour Orbite';
        document.getElementById('exit-solar').dataset.state = 'surface';
    }, 400);

    buildPOIMarkers(body);
}

function exitSurfaceMode() {
    // Cancel any in-progress zoom animation
    if (SS._zoomRaf) {
        cancelAnimationFrame(SS._zoomRaf);
        SS._zoomRaf = null;
    }

    // Immediately stop animateSolar camera follow
    SS.state = 'transitioning';
    SS.focused = null;
    SS.localCameraOffset = null;

    document.getElementById('planet-surface-name').classList.remove('visible');
    document.getElementById('exit-solar').textContent = '← Retour';
    document.getElementById('exit-solar').dataset.state = 'system';

    clearPOIOverlay();
    closePOIPanel();

    SS.controls.minDistance = 30;
    SS.controls.maxDistance = 2200;
    SS.controls.enabled = false;

    const startCamPos = SS.camera.position.clone();
    const startTarget = SS.controls.target.clone();
    const container   = SS.renderer.domElement.parentElement;
    if (container) container.classList.add('is-zooming');

    let t = 0;
    const bk = () => {
        t = Math.min(t + 0.018, 1);
        // Cubic ease-in-out
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        SS.camera.position.lerpVectors(startCamPos, new THREE.Vector3(0, 1000, 2000), e);
        SS.controls.target.lerpVectors(startTarget, new THREE.Vector3(0, 0, 0), e);
        SS.controls.update();

        if (t < 1) {
            SS._zoomRaf = requestAnimationFrame(bk);
        } else {
            SS._zoomRaf = null;
            if (container) container.classList.remove('is-zooming');
            SS.state = 'system';
            SS.controls.enabled = true;
        }
    };
    SS._zoomRaf = requestAnimationFrame(bk);
}

// ─────────────────────────────────────────────
// 10. POI — ZONES GÉOGRAPHIQUES (option C)
// ─────────────────────────────────────────────
(function injectRegionCSS() {
    const s = document.createElement('style');
    s.textContent = `
    /* ── Region labels ── */
    .poi-region {
        position: fixed; pointer-events: none;
        display: flex; align-items: center; gap: 0;
        opacity: 0; transition: opacity 0.25s ease;
        transform: translate(-50%, -50%);
        user-select: none;
    }
    .poi-region.visible { pointer-events: auto; }
    .poi-dot {
        width: 5px; height: 5px; border-radius: 50%;
        background: rgba(120,200,255,0.7);
        flex-shrink: 0;
        box-shadow: 0 0 6px rgba(100,200,255,0.5);
        transition: all 0.2s;
    }
    .poi-region.active .poi-dot, .poi-region:hover .poi-dot {
        background: #fff;
        box-shadow: 0 0 10px rgba(120,220,255,0.9);
        transform: scale(1.4);
    }
    .poi-line {
        width: 28px; height: 1px;
        background: linear-gradient(to right, rgba(100,190,255,0.5), rgba(100,190,255,0.15));
        flex-shrink: 0;
        transition: width 0.2s;
    }
    .poi-region.active .poi-line, .poi-region:hover .poi-line {
        width: 36px;
        background: linear-gradient(to right, rgba(180,230,255,0.8), rgba(100,190,255,0.2));
    }
    .poi-tag {
        display: flex; flex-direction: column;
        padding: 5px 10px;
        background: rgba(4, 10, 28, 0.78);
        border: 1px solid rgba(80, 170, 255, 0.18);
        border-left: none;
        cursor: pointer;
        transition: all 0.2s;
        backdrop-filter: blur(8px);
    }
    .poi-region:hover .poi-tag, .poi-region.active .poi-tag {
        background: rgba(8, 22, 58, 0.88);
        border-color: rgba(100, 200, 255, 0.38);
    }
    .poi-num {
        font: 8px 'Major Mono Display', monospace;
        letter-spacing: 0.2em; color: rgba(80,180,255,0.6);
        line-height: 1.2;
    }
    .poi-name {
        font: 11px 'Major Mono Display', monospace;
        letter-spacing: 0.05em; color: rgba(210,230,255,0.88);
        line-height: 1.3; white-space: nowrap;
        max-width: 140px; overflow: hidden; text-overflow: ellipsis;
    }
    .poi-region.active .poi-name { color: #fff; }

    /* ── Modal backdrop ── */
    #rp-backdrop {
        position: fixed; inset: 0; z-index: 19999;
        background: rgba(1,3,12,0.82);
        backdrop-filter: blur(12px);
        display: none; align-items: center; justify-content: center;
        padding: 24px;
    }

    /* ── Modal window ── */
    #region-panel {
        position: relative;
        width: 100%; max-width: 960px;
        max-height: 90vh;
        background: linear-gradient(135deg, rgba(4,9,28,0.98) 0%, rgba(6,14,40,0.96) 100%);
        border: 1px solid rgba(80,160,255,0.14);
        border-radius: 4px;
        box-shadow: 0 32px 80px rgba(0,0,20,0.9), 0 0 0 1px rgba(60,120,255,0.06), inset 0 1px 0 rgba(100,180,255,0.08);
        display: flex; flex-direction: column;
        overflow: hidden;
        animation: rpFadeIn 0.3s cubic-bezier(0.16,1,0.3,1) both;
        font-family: 'Major Mono Display', monospace;
    }
    @keyframes rpFadeIn {
        from { opacity: 0; transform: scale(0.93) translateY(16px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* ── Close button ── */
    .rp-close {
        position: absolute; top: 18px; right: 20px; z-index: 10;
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
        color: rgba(180,210,255,0.5); width: 32px; height: 32px;
        border-radius: 50%; font-size: 18px; line-height: 1;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: all 0.2s;
    }
    .rp-close:hover { background: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.25); }

    /* ── Layout: video mode = left+right / audio mode = single column ── */
    .rm-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        min-height: 0; flex: 1;
    }
    .rm-layout.audio-only {
        grid-template-columns: 1fr;
    }
    .rm-layout.audio-only .rm-media { display: none; }
    @media (max-width: 680px) {
        .rm-layout { grid-template-columns: 1fr; }
        .rm-layout .rm-media { min-height: 200px; }
    }

    /* ── Media panel (left — YouTube only) ── */
    .rm-media {
        position: relative; background: #000;
        display: flex; align-items: center; justify-content: center;
        min-height: 300px;
        border-right: 1px solid rgba(80,160,255,0.1);
        overflow: hidden;
    }
    .rm-media iframe {
        width: 100%; height: 100%; min-height: 300px;
        border: none; display: block;
    }

    /* ── Info panel ── */
    .rm-info {
        display: flex; flex-direction: column;
        padding: 36px 36px 28px;
        overflow-y: auto; max-height: 90vh;
    }

    /* ── Spotify bar (inside info panel) ── */
    .rm-spotify-bar {
        width: 100%; height: 80px;
        border-radius: 3px; overflow: hidden;
        margin-bottom: 24px; flex-shrink: 0;
        border: 1px solid rgba(29,185,84,0.15);
    }
    .rm-spotify-bar iframe {
        width: 100%; height: 100%; border: none; display: block;
    }

    /* Track title — HUGE */
    .rm-track-name {
        font-size: clamp(28px, 4vw, 48px);
        color: #fff; letter-spacing: 0.04em; line-height: 1;
        margin-bottom: 10px;
    }

    /* Album name — below, smaller, colored */
    .rm-album-name {
        font-size: clamp(13px, 1.8vw, 18px);
        letter-spacing: 0.16em; line-height: 1;
        margin-bottom: 14px;
        color: var(--album-color, rgba(120,180,255,0.9));
        text-shadow: 0 0 24px var(--album-color, rgba(80,140,255,0.3));
    }

    /* Meta row: duration · credits */
    .rm-meta {
        font-size: 9px; letter-spacing: 0.2em;
        color: rgba(140,190,255,0.4);
        margin-bottom: 24px;
        display: flex; flex-wrap: wrap; gap: 0 12px; align-items: center;
    }
    .rm-meta-sep { opacity: 0.3; }

    /* Divider */
    .rm-divider {
        height: 1px; background: rgba(80,140,255,0.12);
        margin-bottom: 20px;
    }

    /* Tabs */
    .rp-tabs {
        display: flex; gap: 0; margin-bottom: 16px;
        border-bottom: 1px solid rgba(60,140,255,0.1);
    }
    .rp-tab {
        background: none; border: none; color: rgba(255,255,255,0.28);
        font: 9px 'Major Mono Display', monospace; letter-spacing: 0.2em;
        padding: 6px 16px 5px; cursor: pointer;
        border-bottom: 2px solid transparent; margin-bottom: -1px;
        transition: all 0.18s;
    }
    .rp-tab.active { color: rgba(120,200,255,0.9); border-bottom-color: rgba(100,190,255,0.6); }
    .rp-tab:hover:not(.active) { color: rgba(255,255,255,0.55); }

    /* Tab text */
    .rp-text {
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 13px; line-height: 1.8;
        color: rgba(180,210,240,0.7);
        flex: 1; margin-bottom: 24px;
        white-space: pre-line;
    }

    /* Action buttons */
    .rp-actions { display: flex; flex-wrap: wrap; gap: 7px; margin-top: auto; }
    .rp-btn {
        flex: 1 1 calc(50% - 4px); min-width: 110px;
        padding: 10px 12px; border: 1px solid;
        font: 8px 'Major Mono Display', monospace; letter-spacing: 0.13em;
        cursor: pointer; transition: all 0.2s; border-radius: 2px;
        text-align: center; display: flex; align-items: center; justify-content: center; gap: 5px;
    }
    .rp-btn.rp-listen { background: rgba(0,200,255,0.07); border-color: rgba(0,200,255,0.25); color: rgba(80,220,255,0.9); }
    .rp-btn.rp-listen:hover { background: rgba(0,200,255,0.15); border-color: rgba(0,220,255,0.5); color: #00e5ff; }
    .rp-btn.rp-clip { background: rgba(220,40,40,0.07); border-color: rgba(220,40,40,0.2); color: rgba(255,100,100,0.85); }
    .rp-btn.rp-clip:hover { background: rgba(220,40,40,0.15); border-color: rgba(255,80,80,0.45); color: #ff5555; }

    /* ── Tracklist sidebar ── */
    #track-sidebar {
        position: fixed; left: 0; top: 50%; transform: translateY(-50%);
        z-index: 9400; width: 260px;
        background: rgba(2,6,20,0.88);
        border-right: 1px solid rgba(80,160,255,0.12);
        backdrop-filter: blur(14px);
        max-height: 80vh; overflow-y: auto; overflow-x: hidden;
        display: none; flex-direction: column;
        scrollbar-width: thin; scrollbar-color: rgba(80,160,255,0.2) transparent;
    }
    #track-sidebar.visible { display: flex; }
    .ts-header {
        font: 8px 'Major Mono Display', monospace; letter-spacing: 0.3em;
        color: rgba(80,160,255,0.5); padding: 14px 16px 10px;
        border-bottom: 1px solid rgba(80,160,255,0.08);
        flex-shrink: 0;
    }
    .ts-row {
        display: flex; align-items: center; gap: 0;
        padding: 0; border-bottom: 1px solid rgba(80,160,255,0.05);
        transition: background 0.15s;
        cursor: pointer;
    }
    .ts-row:hover { background: rgba(80,160,255,0.06); }
    .ts-row.active { background: rgba(80,160,255,0.1); }
    .ts-row.active .ts-name { color: #fff; }
    .ts-row.active .ts-num { color: rgba(120,200,255,0.7); }
    .ts-num {
        font: 8px 'Major Mono Display', monospace; letter-spacing: 0.15em;
        color: rgba(80,160,255,0.35); width: 34px; flex-shrink: 0;
        text-align: right; padding: 11px 8px 11px 14px;
        pointer-events: none;
    }
    .ts-name {
        font: 10px 'Major Mono Display', monospace; letter-spacing: 0.06em;
        color: rgba(180,210,255,0.65); flex: 1;
        padding: 11px 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        pointer-events: none;
    }
    .ts-open {
        flex-shrink: 0; width: 36px; height: 100%; min-height: 36px;
        background: none; border: none; border-left: 1px solid rgba(80,160,255,0.08);
        color: rgba(120,180,255,0.4); cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-size: 13px; transition: all 0.15s;
    }
    .ts-open:hover { background: rgba(80,160,255,0.12); color: rgba(160,210,255,0.9); }

    /* ── Prev / Next nav in modal ── */
    .rp-nav {
        display: flex; align-items: center; justify-content: space-between;
        padding-top: 16px; margin-top: 8px;
        border-top: 1px solid rgba(80,140,255,0.08);
    }
    .rp-nav-btn {
        background: rgba(80,160,255,0.06); border: 1px solid rgba(80,160,255,0.15);
        color: rgba(140,200,255,0.6); font: 10px 'Major Mono Display', monospace;
        letter-spacing: 0.1em; padding: 8px 14px; cursor: pointer; border-radius: 2px;
        transition: all 0.18s;
    }
    .rp-nav-btn:hover:not(:disabled) { background: rgba(80,160,255,0.14); color: #fff; border-color: rgba(100,180,255,0.4); }
    .rp-nav-btn:disabled { opacity: 0.2; cursor: default; }
    .rp-nav-info {
        font: 8px 'Major Mono Display', monospace; letter-spacing: 0.2em;
        color: rgba(120,180,255,0.4);
    }
    `;
    document.head.appendChild(s);

    // Create backdrop + modal DOM once
    const backdrop = document.createElement('div');
    backdrop.id = 'rp-backdrop';
    backdrop.style.display = 'none'; // hidden by default, shown via JS
    backdrop.innerHTML = `
        <div id="region-panel">
            <button class="rp-close" id="rp-close">×</button>
            <div class="rm-layout" id="rm-layout">

                <!-- Left: YouTube video only -->
                <div class="rm-media" id="rm-media"></div>

                <!-- Right: info (always visible) -->
                <div class="rm-info">
                    <div class="rm-track-name" id="rp-title">—</div>
                    <div class="rm-album-name" id="rp-album-name">—</div>
                    <div class="rm-meta" id="rm-meta"></div>
                    <div class="rm-spotify-bar" id="rm-spotify-bar" style="display:none"></div>
                    <div class="rm-divider"></div>
                    <div class="rp-tabs" id="rp-tabs"></div>
                    <div class="rp-text" id="rp-text">—</div>
                    <div class="rp-actions" id="rp-actions"></div>
                </div>

            </div>
        </div>
    `;
    // Prev / Next nav row (inside rm-info, after actions)
    const navHtml = `
        <div class="rp-nav">
            <button class="rp-nav-btn" id="rp-prev">← prev</button>
            <span class="rp-nav-info" id="rp-nav-info">— / —</span>
            <button class="rp-nav-btn" id="rp-next">next →</button>
        </div>`;
    backdrop.querySelector('#rp-actions').insertAdjacentHTML('afterend', navHtml);

    document.body.appendChild(backdrop);
    _rpBackdrop = backdrop;
    _rpPanel    = backdrop.querySelector('#region-panel');

    // Prev / Next wiring
    backdrop.querySelector('#rp-prev').addEventListener('click', () => {
        if (_activePOIBody && activePOIIdx > 0) openPOIPanel(_activePOIBody, activePOIIdx - 1);
    });
    backdrop.querySelector('#rp-next').addEventListener('click', () => {
        if (_activePOIBody && activePOIIdx < _activePOIBody.data.tracks.length - 1)
            openPOIPanel(_activePOIBody, activePOIIdx + 1);
    });

    // Close on backdrop click or button
    backdrop.querySelector('#rp-close').addEventListener('click', closePOIPanel);
    backdrop.addEventListener('click', e => { if (e.target === backdrop) closePOIPanel(); });

    // Create tracklist sidebar
    const sb = document.createElement('div');
    sb.id = 'track-sidebar';
    document.body.appendChild(sb);
    _sidebarEl = sb;
})();

function rotateCameraToRegion(body, idx) {
    const localPos = body.poiPositions[idx];
    if (!localPos || !SS.localCameraOffset) return;
    body.mesh.updateMatrixWorld();

    // Compute target world position: same distance, direction of POI
    const worldPos      = localPos.clone().applyMatrix4(body.mesh.matrixWorld);
    const dir           = new THREE.Vector3().subVectors(worldPos, body.mesh.position).normalize();
    const camDist       = SS.camera.position.distanceTo(body.mesh.position);
    const targetWorldPos = body.mesh.position.clone().add(dir.multiplyScalar(camDist));

    // Convert to local offset (what the render loop reads)
    const invMatrix         = body.mesh.matrixWorld.clone().invert();
    const targetLocalOffset = targetWorldPos.applyMatrix4(invMatrix);
    const startLocalOffset  = SS.localCameraOffset.clone();

    let t = 0;
    const tick = () => {
        if (!SS.localCameraOffset) return;
        t = Math.min(t + 0.022, 1);
        const e = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
        // Update localCameraOffset — the render loop will apply it next frame
        SS.localCameraOffset.lerpVectors(startLocalOffset, targetLocalOffset, e);
        if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

function buildTrackSidebar(body) {
    if (!_sidebarEl) return;
    _sidebarEl.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'ts-header';
    header.textContent = body.key;
    _sidebarEl.appendChild(header);

    body.data.tracks.forEach((track, i) => {
        const row = document.createElement('div');
        row.className = 'ts-row';
        row.dataset.idx = i;
        row.innerHTML = `
            <span class="ts-num">${String(i + 1).padStart(2, '0')}</span>
            <span class="ts-name">${toTitleCase(track.name)}</span>
            <button class="ts-open" title="Ouvrir la fiche">&#9776;</button>
        `;
        // Click on row (not ≡) → camera only
        row.addEventListener('click', e => {
            if (e.target.classList.contains('ts-open')) return; // handled below
            rotateCameraToRegion(body, i);
            _sidebarEl.querySelectorAll('.ts-row').forEach(r => r.classList.remove('active'));
            row.classList.add('active');
        });
        // Click on ≡ → open modal
        row.querySelector('.ts-open').addEventListener('click', e => {
            e.stopPropagation();
            openPOIPanel(body, i);
        });
        _sidebarEl.appendChild(row);
    });

    _sidebarEl.classList.add('visible');
}

function clearTrackSidebar() {
    if (!_sidebarEl) return;
    _sidebarEl.classList.remove('visible');
    _sidebarEl.innerHTML = '';
}

function buildPOIMarkers(body) {
    clearPOIOverlay();
    if (!body.data.tracks) return;

    body.data.tracks.forEach((track, i) => {
        if (i >= body.poiPositions.length) return;
        const localPos = body.poiPositions[i];

        const el = document.createElement('div');
        el.className = 'poi-region';
        el.innerHTML = `
            <div class="poi-dot"></div>
            <div class="poi-line"></div>
            <div class="poi-tag">
                <span class="poi-num">zone ${String(i + 1).padStart(2, '0')}</span>
                <span class="poi-name">${toTitleCase(track.name)}</span>
            </div>
        `;
        el.addEventListener('click', e => { e.stopPropagation(); openPOIPanel(body, i); });
        document.getElementById('poi-overlay').appendChild(el);
        poiMarkers.push({ el, body, localPos, idx: i });
    });

    // Stagger reveal
    setTimeout(() => {
        poiMarkers.forEach((m, i) => setTimeout(() => m.el.classList.add('visible'), i * 55));
    }, 350);

    // Build tracklist sidebar
    buildTrackSidebar(body);
}

function clearPOIOverlay() {
    poiMarkers.forEach(m => m.el.remove());
    poiMarkers   = [];
    activePOIIdx = null;
    clearTrackSidebar();
}

// Reusable vectors for updatePOIOverlay — allocated once, reused every frame
const _poiWorld  = new THREE.Vector3();
const _poiProj   = new THREE.Vector3();
const _poiToCam  = new THREE.Vector3();
const _poiNormal = new THREE.Vector3();

function updatePOIOverlay() {
    if (!SS.focused || !poiMarkers.length) return;
    const body = SS.focused;
    // matrixWorld already updated by the camera-follow block above

    const iW = innerWidth, iH = innerHeight;

    for (const m of poiMarkers) {
        // World position of this POI
        _poiWorld.copy(m.localPos).applyMatrix4(body.mesh.matrixWorld);

        // Project to NDC
        _poiProj.copy(_poiWorld).project(SS.camera);

        // Face-culling: dot of surface normal with camera direction
        _poiToCam.subVectors(SS.camera.position, _poiWorld).normalize();
        _poiNormal.copy(m.localPos).applyQuaternion(body.mesh.quaternion).normalize();
        const dot = _poiNormal.dot(_poiToCam);

        let opacity = Math.max(0, Math.min(1, (dot - 0.08) * 5));
        if (_poiProj.z > 1) opacity = 0;

        const sx = (_poiProj.x  *  0.5 + 0.5) * iW;
        const sy = (-_poiProj.y * 0.5 + 0.5) * iH;

        const s = m.el.style;
        s.opacity       = opacity;
        s.pointerEvents = opacity > 0.15 ? 'auto' : 'none';
        s.left = `${sx}px`;
        s.top  = `${sy}px`;

        m.el.classList.toggle('active', m.idx === activePOIIdx);
    }
}

// ─────────────────────────────────────────────
// 11. REGION PANEL
// ─────────────────────────────────────────────

// Extract YouTube video ID from any youtube URL
function ytID(url) {
    if (!url) return null;
    const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
}

function openPOIPanel(body, idx) {
    if (!_rpBackdrop || !_rpPanel) { console.error('[openPOIPanel] modal DOM not ready'); return; }
    const track = body.data.tracks[idx];
    if (!track) return;
    activePOIIdx   = idx;
    _activePOIBody = body;

    // ── Rotate camera to face this region ──
    rotateCameraToRegion(body, idx);

    // ── Sidebar: highlight active row ──
    if (_sidebarEl) {
        _sidebarEl.querySelectorAll('.ts-row').forEach((r, i) => r.classList.toggle('active', i === idx));
        const activeRow = _sidebarEl.querySelector(`.ts-row[data-idx="${idx}"]`);
        if (activeRow) activeRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    // ── Album color (CSS var for themed glow) ──
    const albumColor = body.data.color || '#5090ff';
    _rpPanel.style.setProperty('--album-color', albumColor);

    // ── Album name (BIG) ──
    const albumLabel = toTitleCase(body.key);
    _rpBackdrop.querySelector('#rp-album-name').textContent = albumLabel;

    // ── Track title ──
    _rpBackdrop.querySelector('#rp-title').textContent = toTitleCase(track.name);

    // ── Meta row: badge · duration · credits ──
    const metaEl = _rpBackdrop.querySelector('#rm-meta');
    metaEl.innerHTML = '';
    const metaParts = [];
    if (body.data.badge)    metaParts.push(toTitleCase(body.data.badge));
    if (track.duration)     metaParts.push(track.duration);
    if (track.credits)      metaParts.push(track.credits);
    metaParts.forEach((p, i) => {
        if (i > 0) { const sep = document.createElement('span'); sep.className = 'rm-meta-sep'; sep.textContent = '·'; metaEl.appendChild(sep); }
        const span = document.createElement('span');
        span.textContent = p;
        metaEl.appendChild(span);
    });

    // ── Media panel : YouTube ──
    const layoutEl = _rpBackdrop.querySelector('#rm-layout');
    const mediaEl  = _rpBackdrop.querySelector('#rm-media');
    mediaEl.querySelectorAll('iframe').forEach(f => f.remove());
    layoutEl.classList.remove('audio-only');

    const playlist = body.data.ytPlaylist ?? null;
    const vid      = ytID(track.clip);

    let embedSrc = null;
    if (vid && playlist) {
        // Clip existant → vidéo dans la playlist (barre de playlist visible)
        embedSrc = `https://www.youtube.com/embed/${vid}?list=${playlist}&rel=0&modestbranding=1`;
    } else if (vid) {
        // Clip sans playlist
        embedSrc = `https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1`;
    } else if (track.ytID && playlist) {
        // Pas de clip → vidéo individuelle dans la playlist
        embedSrc = `https://www.youtube.com/embed/${track.ytID}?list=${playlist}&rel=0&modestbranding=1`;
    } else if (track.ytID) {
        embedSrc = `https://www.youtube.com/embed/${track.ytID}?rel=0&modestbranding=1`;
    }

    if (embedSrc) {
        const frame = document.createElement('iframe');
        frame.src = embedSrc;
        frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        frame.allowFullscreen = true;
        mediaEl.appendChild(frame);
    } else {
        layoutEl.classList.add('audio-only');
    }

    // ── Tabs: histoire + paroles ──
    const tabsEl = _rpBackdrop.querySelector('#rp-tabs');
    const textEl = _rpBackdrop.querySelector('#rp-text');
    tabsEl.innerHTML = '';
    const tabs = [];
    if (track.story)  tabs.push({ label: 'histoire', content: track.story });
    if (track.lyrics) tabs.push({ label: 'paroles',  content: track.lyrics });
    if (!tabs.length) tabs.push({ label: 'histoire', content: '—' });

    const showTab = i => {
        tabsEl.querySelectorAll('.rp-tab').forEach((b, j) => b.classList.toggle('active', j === i));
        textEl.textContent = tabs[i].content;
    };
    tabs.forEach((tab, i) => {
        const btn = document.createElement('button');
        btn.className = 'rp-tab';
        btn.textContent = tab.label;
        btn.addEventListener('click', () => showTab(i));
        tabsEl.appendChild(btn);
    });
    showTab(0);

    // ── Action buttons ──
    const actEl = _rpBackdrop.querySelector('#rp-actions');
    actEl.innerHTML = '';

    if (body.data.listenUrl) {
        const b = document.createElement('button');
        b.className = 'rp-btn rp-listen';
        b.innerHTML = '&#9654;&nbsp; &Eacute;couter';
        b.addEventListener('click', () => window.open(body.data.listenUrl, '_blank'));
        actEl.appendChild(b);
    }
    if (track.clip) {
        const b = document.createElement('button');
        b.className = 'rp-btn rp-clip';
        b.innerHTML = '&#9654;&nbsp; Clip vid&eacute;o';
        b.addEventListener('click', () => window.open(track.clip, '_blank'));
        actEl.appendChild(b);
    }

    // ── Prev / Next navigation ──
    const total   = body.data.tracks.length;
    const prevBtn = _rpBackdrop.querySelector('#rp-prev');
    const nextBtn = _rpBackdrop.querySelector('#rp-next');
    const navInfo = _rpBackdrop.querySelector('#rp-nav-info');
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.disabled = idx === total - 1;
    if (navInfo) navInfo.textContent = `${String(idx + 1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`;

    // ── Open modal ──
    _rpBackdrop.style.display = 'flex';
}

function closePOIPanel() {
    if (!_rpBackdrop) return;
    _rpBackdrop.style.display = 'none';
    activePOIIdx = null;
    // Kill iframe pour stopper la lecture
    _rpBackdrop.querySelectorAll('#rm-media iframe').forEach(f => f.remove());
}


// ─────────────────────────────────────────────
// 12. NAVIGATION & UI WIRING
// ─────────────────────────────────────────────

function openSolarSystem() {
    launchSolarWarp();
}

function openSolarAndZoom(albumKey) {
    launchSolarWarp(albumKey);
}

function launchSolarWarp(targetKey = null) {
    if (isWarping) return;
    isWarping    = true;
    warpProgress = 0;

    // ── Set mode to 3D NOW so animateSolar can start rendering ──
    SYSTEM_STATE.mode = '3D';

    const site  = document.getElementById('site-wrapper');
    const view  = document.getElementById('solar-system-view');

    // ── Flash overlay at body level (not inside solar-system-view) ──
    let flashEl = document.getElementById('warp-body-flash');
    if (!flashEl) {
        flashEl = document.createElement('div');
        flashEl.id = 'warp-body-flash';
        flashEl.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;opacity:0;background:rgb(215,235,255);';
        document.body.appendChild(flashEl);
    }

    // ── 1. Hide site UI instantly ──
    site.style.visibility = 'hidden';

    // ── 2. Init 3D (mode is already '3D' so animateSolar will run) ──
    initSolar().then(() => {
        // Re-start render loop if it stopped (e.g. after closeSolarSystem)
        if (!_solarAnimating) animateSolar();
    });

    // ── 3. Animate: hyperspace on 2D canvas → flash → reveal 3D ──
    const DURATION = 1850;
    let lastTime = null;

    const warpTick = (now) => {
        if (!lastTime) lastTime = now;
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        warpProgress = Math.min(warpProgress + dt / (DURATION / 1000), 1);

        // Flash in final 22%
        if (warpProgress > 0.76) {
            const fp = (warpProgress - 0.76) / 0.24;
            const fa = fp < 0.5 ? fp * 2 : 1 - (fp - 0.5) * 2;
            flashEl.style.opacity = fa * 0.97;

            // At peak flash → instant cut to 3D
            if (fp >= 0.5 && !launchSolarWarp._cut) {
                launchSolarWarp._cut = true;
                canvas2D.style.display = 'none';
                view.style.transition  = 'none';
                view.classList.remove('hidden');
                void view.offsetWidth;
                view.style.transition  = '';
            }
        } else {
            flashEl.style.opacity = 0;
        }

        if (warpProgress < 1) {
            requestAnimationFrame(warpTick);
        } else {
            isWarping            = false;
            launchSolarWarp._cut = false;
            warpProgress         = 0;
            flashEl.style.opacity = 0;
            site.classList.add('hidden');
            site.style.visibility = '';
            SS.controls.enabled   = true;

            if (targetKey) {
                const body = SS.bodies.find(b => b.key === targetKey);
                if (body) setTimeout(() => zoomToPlanet(body), 100);
            }
        }
    };

    requestAnimationFrame(warpTick);
}

function closeSolarSystem() {
    SYSTEM_STATE.mode = '2D';
    isWarping         = false;
    warpProgress      = 0;
    canvas2D.style.display = '';   // restore 2D canvas
    canvas2D.style.zIndex  = '';
    tickGalaxy();
    document.getElementById('site-wrapper').classList.remove('hidden');
    document.getElementById('solar-system-view').classList.add('hidden');

    if (SS.state === 'surface') {
        SS.state = 'system';
        SS.focused = null;
        document.getElementById('planet-surface-name').classList.remove('visible');
        document.getElementById('back-to-system-btn').classList.remove('visible');
        clearPOIOverlay();
        closePOIPanel();
    }
}

document.getElementById('explorer-btn').addEventListener('click', openSolarSystem);
document.getElementById('exit-solar').addEventListener('click', () => {
    const btn = document.getElementById('exit-solar');
    if (btn.dataset.state === 'surface') {
        closePOIPanel();
        exitSurfaceMode();
    } else {
        closeSolarSystem();
    }
});
document.querySelectorAll('.album-card').forEach(card => {
    card.addEventListener('click', () => {
        const key = card.getAttribute('data-album');
        if (key) openSolarAndZoom(key);
    });
});

// Debounced resize: camera/renderer update immediately, galaxy reinit after 150ms quiet period
let _resizeTimer = null;
window.addEventListener('resize', () => {
    resize2D();
    if (SS.renderer) {
        SS.camera.aspect = innerWidth / innerHeight;
        SS.camera.updateProjectionMatrix();
        SS.renderer.setSize(innerWidth, innerHeight);
    }
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(initGalaxy, 150);
});


// ─────────────────────────────────────────────
// 14. BOOT
// ─────────────────────────────────────────────
(function boot() {
    resize2D();
    initGalaxy();

    const bar      = document.getElementById('loading-bar');
    const screen   = document.getElementById('loading-screen');
    let pct = 0;
    const iv = setInterval(() => {
        pct += Math.random() * 20 + 8;
        if (pct >= 100) {
            pct = 100;
            clearInterval(iv);
            if (bar) bar.style.width = '100%';
            setTimeout(() => { if (screen) screen.classList.add('hidden'); }, 300);
        } else {
            if (bar) bar.style.width = pct + '%';
        }
    }, 40);

    const logoCanvas  = document.getElementById('logoCanvas');
    const loadingLogo = document.getElementById('loadingLogoCanvas');
    const footerLogo  = document.getElementById('footerLogoCanvas');
    const _logoImg = new Image();
    _logoImg.src = 'images/Logo Raptol.png';
    _logoImg.onload = () => {
        [logoCanvas, loadingLogo, footerLogo].forEach(el => {
            if (!el) return;
            const lctx = el.getContext('2d');
            const ratio = Math.min(el.width / _logoImg.width, el.height / _logoImg.height);
            const w = _logoImg.width * ratio, h = _logoImg.height * ratio;
            lctx.clearRect(0, 0, el.width, el.height);
            lctx.drawImage(_logoImg, (el.width - w) / 2, (el.height - h) / 2, w, h);
        });
    };

    // Reveal-on-scroll
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.glass-card, .section-title, .gallery-item, .hero-typography')
        .forEach(el => obs.observe(el));

    // Newsletter form
    const form = document.getElementById('newsletter-form');
    if (form) {
        form.addEventListener('submit', async e => {
            e.preventDefault();
            const btn = document.getElementById('form-submit-btn');
            btn.textContent = 'Envoi...';
            try {
                const res = await fetch(form.action, {
                    method: 'POST',
                    body: new FormData(form),
                    headers: { Accept: 'application/json' }
                });
                if (res.ok) {
                    document.getElementById('form-success').style.display = 'block';
                    form.reset();
                }
            } catch(err) {}
            btn.textContent = "S'abonner →";
        });
    }

    // Hamburger menu — pilote l'overlay indépendant
    const hamburger   = document.getElementById('hamburger');
    const mobileMenu  = document.getElementById('mobile-menu');
    const closeMenu   = () => {
        hamburger?.classList.remove('open');
        mobileMenu?.classList.remove('open');
    };
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('open');
            mobileMenu.classList.toggle('open');
        });
        document.getElementById('mob-close')?.addEventListener('click', closeMenu);
        mobileMenu.querySelectorAll('a').forEach(el => {
            el.addEventListener('click', closeMenu);
        });
    }
    // Exploration 3D dans le menu mobile
    document.getElementById('mob-explorer-btn')?.addEventListener('click', () => {
        closeMenu();
        setTimeout(() => document.getElementById('explorer-btn')?.click(), 300);
    });

    // Logo dans le menu mobile
    const mobLogoCanvas = document.getElementById('mobLogoCanvas');
    if (mobLogoCanvas && _logoImg?.complete && _logoImg.naturalWidth) {
        const lctx = mobLogoCanvas.getContext('2d');
        const ratio = Math.min(mobLogoCanvas.width / _logoImg.width, mobLogoCanvas.height / _logoImg.height);
        const w = _logoImg.width * ratio, h = _logoImg.height * ratio;
        lctx.drawImage(_logoImg, (mobLogoCanvas.width - w) / 2, (mobLogoCanvas.height - h) / 2, w, h);
    } else if (mobLogoCanvas) {
        const _mobImg = new Image();
        _mobImg.src = 'images/Logo Raptol.png';
        _mobImg.onload = () => {
            const lctx = mobLogoCanvas.getContext('2d');
            const ratio = Math.min(mobLogoCanvas.width / _mobImg.width, mobLogoCanvas.height / _mobImg.height);
            const w = _mobImg.width * ratio, h = _mobImg.height * ratio;
            lctx.drawImage(_mobImg, (mobLogoCanvas.width - w) / 2, (mobLogoCanvas.height - h) / 2, w, h);
        };
    }

    // Cursor ring
    const ring = document.getElementById('cursor-ring');
    if (ring) {
        window.addEventListener('mousemove', e => {
            ring.style.left = e.clientX + 'px';
            ring.style.top  = e.clientY + 'px';
        });
    }
})();

// ── Attribution: Planet textures from Solar System Scope (CC BY 4.0) ──
// https://www.solarsystemscope.com/textures/

// ── Scroll to top — mobile only ──
(function() {
    const btn = document.getElementById('scroll-top-btn');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) btn.classList.add('visible');
        else btn.classList.remove('visible');
    }, { passive: true });
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();
