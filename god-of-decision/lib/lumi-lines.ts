import { dayKey } from "@/lib/tarot";
import type { Lang } from "@/types/tarot";

/**
 * Everything Lumi says, in one place.
 *
 * Voice (docs/MASCOT.md → Personality): friendly, gentle, curious, a
 * little clumsy, quietly wise. Listens more than talks, never judges a
 * question, gets excited about small wins, dozes off when nothing is
 * happening.
 *
 * Rules for new lines:
 *   - Short. A bubble holds about 40 characters comfortably, 60 at most.
 *   - Lumi is a companion, not a fortune teller: never promise an
 *     outcome, never contradict what was drawn.
 *   - At most one emoji, at the end, from ✨ 💫 🌙 ⭐ ☁️ 💜.
 *   - Every moment needs `vi` and `en`, ideally 3+ variants each.
 *
 * Use `lumiLine(moment)` anywhere (it is pure, so render and server
 * are fine), and <LumiSays moment="..." /> to render a bubble.
 */

export const LUMI_LINES = {
    /* ------------------------------------------------ greetings */
    greet_morning: {
        vi: [
            "Chào buổi sáng! Mình vừa dậy nè ☁️",
            "Sáng nay trời đẹp ghê, bắt đầu nhẹ nhàng nha",
            "Dậy rồi hả? Mình để dành một lá bài cho bạn đó ✨",
        ],
        en: [
            "Good morning! I just woke up too ☁️",
            "Lovely morning. Let's start gently",
            "You're up! I saved a card for you ✨",
        ],
    },
    greet_noon: {
        vi: [
            "Nghỉ trưa chút đi, mình ngồi cùng nè",
            "Giữa ngày rồi, thở một hơi thật sâu nha",
            "Trưa rồi đó, đừng quên ăn uống nha 💜",
        ],
        en: [
            "Take a little break, I'll sit with you",
            "Halfway through the day. Deep breath",
            "Lunchtime! Don't forget to eat 💜",
        ],
    },
    greet_afternoon: {
        vi: [
            "Chiều nay bạn thấy sao rồi?",
            "Buổi chiều hợp để nghĩ chậm lại một chút",
            "Mình ở đây nếu bạn cần ngẫm nghĩ nha",
        ],
        en: [
            "How's your afternoon going?",
            "Afternoons are good for slowing down",
            "I'm here if you want to think something through",
        ],
    },
    greet_evening: {
        vi: [
            "Một ngày dài rồi nhỉ, ngồi xuống đây nè 🌙",
            "Tối rồi, mình thắp sao cho bạn nha ⭐",
            "Hôm nay bạn đã cố gắng nhiều đó",
        ],
        en: [
            "Long day, huh? Come sit with me 🌙",
            "Evening! I'll light up the stars for you ⭐",
            "You did a lot today",
        ],
    },
    greet_night: {
        vi: [
            "Khuya rồi đó… mình hơi buồn ngủ 🌙",
            "Còn thức hả? Mình thức cùng bạn",
            "Đêm yên quá, nghĩ gì cũng nhẹ hơn nè",
        ],
        en: [
            "It's late… I'm a bit sleepy 🌙",
            "Still up? I'll stay up with you",
            "The night is quiet. Thoughts feel lighter",
        ],
    },

    /* ------------------------------------------------ daily card */
    daily_idle: {
        vi: [
            "Giữ lá bài thật lâu nha ✨",
            "Lá bài hôm nay đang chờ bạn đó",
            "Giữ ngón tay lên lá bài, mình đếm cùng nha",
        ],
        en: [
            "Press and hold the card ✨",
            "Today's card is waiting for you",
            "Hold your finger on it, I'll count with you",
        ],
    },
    daily_holding: {
        vi: [
            "Sắp rồi, sắp rồi…",
            "Một chút nữa thôi…",
            "Mình thấy nó sáng lên rồi!",
        ],
        en: [
            "Almost there…",
            "Just a little longer…",
            "It's starting to glow!",
        ],
    },
    daily_revealed: {
        vi: [
            "Ồ! Lá này dành cho bạn đó 💫",
            "Oa, lá đẹp ghê!",
            "Mình biết ngay mà ✨",
        ],
        en: [
            "Ooh! This one's for you 💫",
            "Wow, what a card!",
            "I had a feeling ✨",
        ],
    },
    daily_return: {
        vi: [
            "Chạm lá bài để mình kể nghe nhé",
            "Muốn nghe lại thông điệp hôm nay không?",
            "Lá của bạn vẫn ở đây nè",
        ],
        en: [
            "Tap the card and I'll tell you about it",
            "Want to hear today's message again?",
            "Your card is still right here",
        ],
    },

    /* ------------------------------------------------ tarot */
    tarot_shuffle: {
        vi: [
            "Mình đang xáo bài nè…",
            "Xào xạc xào xạc ☁️",
            "Chờ mình một xíu nha",
        ],
        en: ["Shuffling the deck…", "Shuffle shuffle ☁️", "One moment please"],
    },
    tarot_pick: {
        vi: [
            "Chọn theo cảm giác đầu tiên nha",
            "Đừng nghĩ nhiều, tay bạn biết mà",
            "Lá nào gọi bạn thì chọn lá đó",
        ],
        en: [
            "Go with your first feeling",
            "Don't overthink it, your hand knows",
            "Pick the one that calls to you",
        ],
    },
    tarot_choose: {
        vi: [
            "Bạn muốn mình nhìn vào khía cạnh nào?",
            "Chọn một chủ đề, mình đọc cho nha",
            "Tình cảm, công việc, hay chuyện khác?",
        ],
        en: [
            "Which part of life should I look at?",
            "Pick a topic and I'll read for you",
            "Love, work, or something else?",
        ],
    },
    tarot_thinking: {
        vi: [
            "Để mình đọc kỹ từng lá nha…",
            "Hmm, các lá đang nói chuyện với nhau…",
            "Mình đang lắng nghe các lá bài",
        ],
        en: [
            "Let me read each card carefully…",
            "Hmm, the cards are talking to each other…",
            "I'm listening to the cards",
        ],
    },
    tarot_reveal: {
        vi: [
            "Đây là những gì mình thấy nè 💫",
            "Đọc chậm thôi, cảm nhận từng chữ nha",
            "Bạn thấy chỗ nào đúng với mình không?",
        ],
        en: [
            "Here's what I see 💫",
            "Read slowly, let it sink in",
            "Does any part feel true to you?",
        ],
    },
    tarot_reversed: {
        vi: [
            "Lá ngược không xấu đâu, chỉ là góc nhìn khác",
            "Ngược một chút cũng không sao nha",
        ],
        en: [
            "Reversed isn't bad, just another angle",
            "A little upside down is okay",
        ],
    },

    /* ------------------------------------------------ decision */
    oracle_idle: {
        vi: [
            "Nghĩ về điều bạn đang phân vân nha",
            "Mình nghe nè, cứ nghĩ trong đầu thôi",
            "Khi lý trí chưa đủ, mình ở đây",
        ],
        en: [
            "Think about what's on your mind",
            "I'm listening. Just think it",
            "When logic isn't enough, I'm here",
        ],
    },
    oracle_holding: {
        vi: ["Giữ yên nha…", "Mình đang mở sách…", "Sách đang lật trang…"],
        en: ["Hold still…", "Opening the book…", "The pages are turning…"],
    },
    oracle_thinking: {
        vi: [
            "Để mình ngẫm câu trả lời này chút…",
            "Mình đang nghĩ cho bạn nè",
            "Hmm, thú vị ghê…",
        ],
        en: [
            "Let me think about this answer…",
            "Thinking it over for you",
            "Hmm, how interesting…",
        ],
    },
    oracle_reveal: {
        vi: [
            "Sách đã trả lời rồi nè ✨",
            "Câu này nghe thấy sao?",
            "Lắng nghe cảm giác đầu tiên của bạn nha",
        ],
        en: [
            "The book has spoken ✨",
            "How does that feel?",
            "Notice your very first reaction",
        ],
    },

    /* ------------------------------------------------ small wins */
    streak: {
        vi: [
            "Bạn ghé đều quá, mình vui ghê ⭐",
            "Thêm một ngày nữa rồi!",
            "Chuỗi sao của bạn dài ra rồi nè ✨",
        ],
        en: [
            "You keep coming back, I'm so happy ⭐",
            "Another day!",
            "Your star chain is growing ✨",
        ],
    },
    first_reading: {
        vi: [
            "Lần đầu tiên nè! Mình hồi hộp quá",
            "Chào mừng bạn đến với sách của mình 💜",
        ],
        en: ["Your very first! I'm so excited", "Welcome to my book 💜"],
    },
    share: {
        vi: ["Khoe với bạn bè đi nè ✨", "Lá này đẹp, đáng chia sẻ lắm"],
        en: ["Show your friends ✨", "This one's worth sharing"],
    },

    /* ------------------------------------------------ history */
    history_empty: {
        vi: [
            "Chưa có gì ở đây… mình ngủ chút nha 🌙",
            "Trang nhật ký còn trống trơn nè",
        ],
        en: ["Nothing here yet… I'll nap a bit 🌙", "The diary is still empty"],
    },
    history_view: {
        vi: [
            "Nhìn lại cũng là một cách hiểu mình",
            "Hôm đó bạn đã hỏi điều này nè",
            "Giờ đọc lại bạn thấy sao?",
        ],
        en: [
            "Looking back is a way to know yourself",
            "This is what you asked that day",
            "How does it read now?",
        ],
    },

    /* ------------------------------------------------ screens */
    explore_browse: {
        vi: [
            "Đây là cả bộ bài của mình nè ✨",
            "Lá nào cũng có câu chuyện riêng",
            "Chạm thử một lá đi, mình kể cho nghe",
        ],
        en: [
            "This is my whole deck ✨",
            "Every card has its own story",
            "Tap one, I'll tell you about it",
        ],
    },
    history_list: {
        vi: [
            "Mình giữ cẩn thận từng trang cho bạn nè",
            "Nhìn lại thấy bạn đã đi xa ghê",
            "Trang nào bạn muốn đọc lại?",
        ],
        en: [
            "I keep every page safe for you",
            "Look how far you've come",
            "Which page do you want to reread?",
        ],
    },
    profile_hello: {
        vi: [
            "Góc nhỏ của riêng bạn nè 💜",
            "Mình nhớ hết những lần bạn ghé đó",
            "Hôm nay bạn thấy thế nào?",
        ],
        en: [
            "Your own little corner 💜",
            "I remember every visit",
            "How are you feeling today?",
        ],
    },
    login_welcome: {
        vi: [
            "Bạn quay lại rồi! Mình nhớ bạn ghê",
            "Đăng nhập để mình nhận ra bạn nha",
        ],
        en: ["You're back! I missed you", "Sign in so I recognise you"],
    },
    signup_welcome: {
        vi: [
            "Chào bạn mới! Mình là Lumi nè ✨",
            "Làm quen nha, mình sẽ giữ sổ cho bạn",
        ],
        en: [
            "Hi, new friend! I'm Lumi ✨",
            "Nice to meet you, I'll keep your book",
        ],
    },

    /* ------------------------------------------------ trouble */
    error: {
        vi: [
            "Ối, mình làm rơi gì đó rồi… thử lại nha",
            "Hình như sao bị lạc đường, thử lại giúp mình",
            "Xin lỗi nha, mình hơi vụng một chút",
        ],
        en: [
            "Oops, I dropped something… try again?",
            "The stars got lost. Try once more?",
            "Sorry, I'm a little clumsy",
        ],
    },
    need_login: {
        vi: [
            "Đăng nhập để mình kể hết cho bạn nghe nha",
            "Mình muốn giải nghĩa lắm, bạn đăng nhập nha 💜",
        ],
        en: [
            "Sign in so I can tell you everything",
            "I'd love to explain, please sign in 💜",
        ],
    },
    quota_low: {
        vi: [
            "Sao của mình sắp mờ rồi… mai sáng lại nha",
            "Hôm nay mình hơi mệt rồi 🌙",
        ],
        en: [
            "My star is dimming… it'll shine tomorrow",
            "I'm a bit tired today 🌙",
        ],
    },
    offline: {
        vi: [
            "Mất sóng rồi… mình ngủ chờ nha 🌙",
            "Hình như mây che mất mạng rồi ☁️",
        ],
        en: [
            "No signal… I'll nap until it's back 🌙",
            "Clouds are blocking the internet ☁️",
        ],
    },
} as const satisfies Record<string, Record<Lang, readonly string[]>>;

export type LumiMoment = keyof typeof LUMI_LINES;

/** Small string hash, so the same inputs always pick the same line. */
function hash(text: string) {
    let h = 2166136261;

    for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }

    return h >>> 0;
}

interface PickOptions {
    lang?: Lang;

    /**
     * Varies the pick. Lines are stable for a given moment, day and
     * seed, so a re-render never swaps the sentence mid-read and the
     * server and client agree. Pass something like a card slug or a
     * counter to get a different line for a different occasion.
     */
    seed?: string | number;
}

interface LineOptions extends PickOptions {
    /**
     * Steps through the variants from the picked one. Tapping Lumi
     * passes 1, 2, 3… so every tap says something new.
     */
    offset?: number;
}

/** One line for a moment. Pure: safe in render and on the server. */
export function lumiLine(
    moment: LumiMoment,
    { lang = "vi", seed = "", offset = 0 }: LineOptions = {},
) {
    const lines = LUMI_LINES[moment][lang];
    const start = hash(`${moment}|${dayKey()}|${seed}`);

    return lines[(start + offset) % lines.length];
}

/** The greeting moment for an hour of the day. */
export function greetingMoment(hour = new Date().getHours()): LumiMoment {
    if (hour >= 5 && hour < 11) return "greet_morning";
    if (hour >= 11 && hour < 13) return "greet_noon";
    if (hour >= 13 && hour < 18) return "greet_afternoon";
    if (hour >= 18 && hour < 22) return "greet_evening";
    return "greet_night";
}

/**
 * Picks the moment for a sheet that shows an AI reading, from the
 * store fields every pillar shares.
 */
export function readingMoment(
    pillar: "daily" | "tarot" | "oracle",
    readStatus: string,
    readErrorStatus?: number | null,
): LumiMoment {
    if (readStatus === "error") {
        return readErrorStatus === 401 ? "need_login" : "error";
    }

    if (readStatus === "reading") {
        return pillar === "oracle" ? "oracle_thinking" : "tarot_thinking";
    }

    return pillar === "daily"
        ? "daily_revealed"
        : pillar === "tarot"
          ? "tarot_reveal"
          : "oracle_reveal";
}
