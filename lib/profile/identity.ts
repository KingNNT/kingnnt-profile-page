export interface Social {
  id: "linkedin" | "github";
  label: string;
  url: string;
}

export interface Identity {
  fullName: string;
  englishName: string;
  nickname: string;
  jobTitle: string;
  email: string;
  location: { city: string; country: string };
  socials: readonly Social[];
}

/**
 * Số điện thoại và ngày sinh trong CV cố ý không có ở đây. Trang này công khai
 * và được crawler đọc; một số điện thoại đặt trên trang công khai là một số
 * điện thoại đã bị thu thập.
 */
export const IDENTITY: Identity = {
  fullName: "Ninh Ngọc Tuấn",
  englishName: "Jesse",
  nickname: "KingNNT",
  jobTitle: "Solutions Consultant",
  email: "Work.KingNNT@gmail.com",
  location: { city: "Hà Nội", country: "Việt Nam" },
  socials: [
    { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/kingnnt/" },
    { id: "github", label: "GitHub", url: "https://github.com/KingNNT" },
  ],
};
