import {
    Briefcase,
    Compass,
    GraduationCap,
    Heart,
    HeartPulse,
    Sprout,
    Users,
    Wallet,
} from "lucide-react";
import type { ElementType } from "react";

import type { Topic } from "@/types/tarot";

export interface TopicOption {
    id: Topic;
    label: string;
    hint: string;
    icon: ElementType;
}

/**
 * Life aspects a reading can be framed around.
 *
 * The ids must match backend/constants/topics.js. That file
 * owns the wording the AI is given; this one owns what the
 * user sees.
 */
export const TOPICS: TopicOption[] = [
    {
        id: "general",
        label: "Tổng quát",
        hint: "Giai đoạn này nói chung",
        icon: Compass,
    },
    {
        id: "love",
        label: "Tình yêu",
        hint: "Chuyện tình cảm",
        icon: Heart,
    },
    {
        id: "relationships",
        label: "Mối quan hệ",
        hint: "Gia đình, bạn bè",
        icon: Users,
    },
    {
        id: "career",
        label: "Sự nghiệp",
        hint: "Công việc, hướng đi",
        icon: Briefcase,
    },
    {
        id: "money",
        label: "Tiền bạc",
        hint: "Thu nhập, chi tiêu",
        icon: Wallet,
    },
    {
        id: "health",
        label: "Sức khỏe",
        hint: "Cơ thể, nghỉ ngơi",
        icon: HeartPulse,
    },
    {
        id: "growth",
        label: "Bản thân",
        hint: "Con người bạn đang thành",
        icon: Sprout,
    },
    {
        id: "study",
        label: "Học hành",
        hint: "Việc học, kỹ năng",
        icon: GraduationCap,
    },
];

export const TOPIC_BY_ID = Object.fromEntries(
    TOPICS.map((topic) => [topic.id, topic]),
) as Record<Topic, TopicOption>;

export function topicLabel(id: Topic) {
    return TOPIC_BY_ID[id]?.label ?? "Tổng quát";
}
