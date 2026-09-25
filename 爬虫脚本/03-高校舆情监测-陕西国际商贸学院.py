"""
陕西国际商贸学院 舆情监测脚本
平台：微博 / 小红书 / 抖音
"""

from scrapling.fetchers import StealthyFetcher, DynamicFetcher
import json
from datetime import datetime

KEYWORD = "陕西国际商贸学院"
OUTPUT_DIR = r"C:\Users\Administrator\Desktop\LOOP-PARK-SOP\爬虫脚本"

def crawl_weibo():
    """微博搜索"""
    print("\n" + "=" * 50)
    print("平台：微博")
    print("=" * 50)

    try:
        # 微博搜索 URL
        search_url = f'https://s.weibo.com/weibo?q={KEYWORD}'
        page = StealthyFetcher.fetch(
            search_url,
            headless=True,
            solve_cloudflare=False,
            timeout=30000
        )
        print(f"  HTTP {page.status}")

        # 提取微博内容
        weibo_items = page.css('.card-wrap')
        print(f"  找到 {len(weibo_items)} 条相关微博")

        results = []
        for item in weibo_items[:10]:
            content = item.css('.txt::text').get('')
            author = item.css('.name::text').get('')
            date = item.css('.from::text').get('').strip()

            if content:
                results.append({
                    'platform': '微博',
                    'author': author.strip(),
                    'content': content.strip()[:200],
                    'date': date,
                    'url': ''
                })

        return results
    except Exception as e:
        print(f"  ❌ 抓取失败: {e}")
        return []

def crawl_xiaohongshu():
    """小红书搜索"""
    print("\n" + "=" * 50)
    print("平台：小红书")
    print("=" * 50)

    try:
        search_url = f'https://www.xiaohongshu.com/search_result?keyword={KEYWORD}'
        page = DynamicFetcher.fetch(
            search_url,
            headless=True,
            network_idle=True,
            timeout=30000
        )
        print(f"  HTTP {page.status}")

        # 小红书笔记卡片
        notes = page.css('.note-item')
        print(f"  找到 {len(notes)} 条相关笔记")

        results = []
        for note in notes[:10]:
            title = note.css('.title::text').get('')
            author = note.css('.author::text').get('')
            likes = note.css('.like-wrapper .count::text').get('0')

            if title:
                results.append({
                    'platform': '小红书',
                    'author': author.strip(),
                    'title': title.strip(),
                    'likes': likes.strip(),
                })

        return results
    except Exception as e:
        print(f"  ❌ 抓取失败: {e}")
        return []

def crawl_douyin():
    """抖音搜索"""
    print("\n" + "=" * 50)
    print("平台：抖音")
    print("=" * 50)

    try:
        search_url = f'https://www.douyin.com/search/{KEYWORD}'
        page = DynamicFetcher.fetch(
            search_url,
            headless=True,
            network_idle=True,
            timeout=30000
        )
        print(f"  HTTP {page.status}")

        # 抖音视频卡片
        videos = page.css('.search-result-card')
        print(f"  找到 {len(videos)} 条相关视频")

        results = []
        for v in videos[:10]:
            title = v.css('.video-title::text').get('')
            author = v.css('.author-name::text').get('')
            likes = v.css('.like-count::text').get('0')

            if title:
                results.append({
                    'platform': '抖音',
                    'author': author.strip(),
                    'title': title.strip(),
                    'likes': likes.strip(),
                })

        return results
    except Exception as e:
        print(f"  ❌ 抓取失败: {e}")
        return []

if __name__ == '__main__':
    print(f"舆情监测：{KEYWORD}")
    print(f"时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    all_results = []
    all_results.extend(crawl_weibo())
    all_results.extend(crawl_xiaohongshu())
    all_results.extend(crawl_douyin())

    # 保存结果
    output_file = f'{OUTPUT_DIR}\\舆情监测_{KEYWORD}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 50)
    print(f"总计抓取 {len(all_results)} 条内容")
    print(f"结果已保存: {output_file}")
    print("=" * 50)
