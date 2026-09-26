import unittest

from build_jcms_data import BOARD_ALIASES, canonical_board_name, get_board_name
from update_jcms import normalize_episode, parse_title_parts


class BoardNameTests(unittest.TestCase):
    def test_all_aliases_in_both_collectors(self):
        for old, expected in BOARD_ALIASES.items():
            with self.subTest(board=old):
                title = f"20260926 正赛 第一期 第一局-{old}"
                self.assertEqual(canonical_board_name(old), expected)
                self.assertEqual(get_board_name(title), expected)
                self.assertEqual(parse_title_parts(title)["board"], expected)
                episode = normalize_episode({"title": title, "bvid": "BV123", "duration": 123})
                self.assertEqual(episode["board"], expected)
                self.assertEqual(episode["date"], "2026-09-26")
                self.assertEqual(episode["url"], "https://www.bilibili.com/video/BV123")

    def test_canonical_and_new_boards_are_unchanged(self):
        for board in [*BOARD_ALIASES.values(), "青丘夜影", "狼王守卫", "白狼王骑士"]:
            with self.subTest(board=board):
                self.assertEqual(canonical_board_name(board), board)
                self.assertEqual(parse_title_parts(f"20260926 第一局-{board}")["board"], board)


if __name__ == "__main__":
    unittest.main()
