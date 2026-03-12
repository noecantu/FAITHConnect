// utils/reportSorting.ts
import { Member, Contribution, AttendanceRecord } from "@/app/lib/types";

export function sortMembersByName(members: Member[]) {
  return [...members].sort((a, b) => {
    const lastA = (a.lastName ?? "").toLowerCase();
    const lastB = (b.lastName ?? "").toLowerCase();
    if (lastA !== lastB) return lastA < lastB ? -1 : 1;

    const firstA = (a.firstName ?? "").toLowerCase();
    const firstB = (b.firstName ?? "").toLowerCase();
    if (firstA !== firstB) return firstA < firstB ? -1 : 1;

    return 0;
  });
}

export function sortContributionsByMemberName(
  contributions: Contribution[],
  members: Member[]
) {
  return [...contributions].sort((a, b) => {
    const memberA = members.find(m => m.id === a.memberId);
    const memberB = members.find(m => m.id === b.memberId);

    const lastA = (memberA?.lastName ?? "").toLowerCase();
    const lastB = (memberB?.lastName ?? "").toLowerCase();
    if (lastA !== lastB) return lastA < lastB ? -1 : 1;

    const firstA = (memberA?.firstName ?? "").toLowerCase();
    const firstB = (memberB?.firstName ?? "").toLowerCase();
    if (firstA !== firstB) return firstA < firstB ? -1 : 1;

    return 0;
  });
}

export function sortAttendance(
  records: AttendanceRecord[],
  members: Member[]
) {
  return [...records].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) return dateA - dateB;

    const memberA = members.find(m => m.id === a.memberId);
    const memberB = members.find(m => m.id === b.memberId);

    const lastA = (memberA?.lastName ?? "").toLowerCase();
    const lastB = (memberB?.lastName ?? "").toLowerCase();
    if (lastA !== lastB) return lastA < lastB ? -1 : 1;

    const firstA = (memberA?.firstName ?? "").toLowerCase();
    const firstB = (memberB?.firstName ?? "").toLowerCase();
    if (firstA !== firstB) return firstA < firstB ? -1 : 1;

    return 0;
  });
}
