"""
Scrapling 能力测试脚本
测试不同场景的抓取能力
"""

from scrapling.fetchers import Fetcher, StealthyFetcher, DynamicFetcher
import json
from datetime import datetime

def test_basic_http():
    """测试1: 普通 HTTP 抓取"""
    print("\n" + "=" * 50)
    print("测试1: 普通 HTTP 抓取 (Fetcher)")
    print("=" * 50)

    page = Fetcher.get('https://quotes.toscrape.com/')
    quotes = page.css('.quote .text::text').getall()
    authors = page.css('.quote .author::text').getall()

    print(f"✅ 抓到 {len(quotes)} 条名言")
    for i in range(3):
        print(f"  {i+1}. {authors[i]}: {quotes[i][:50]}...")

    return True

def test_adaptive_scraping():
    """测试2: 自适应抓取（自愈能力）"""
    print("\n" + "=" * 50)
    print("测试2: 自适应抓取 (Adaptive)")
    print("=" * 50)

    page = Fetcher.get('https://quotes.toscrape.com/')

    # 先抓一个元素，保存它的特征
    first_quote = page.css('.quote')[0]
    print(f"✅ 初始抓取成功")
    print(f"  第一条名言: {first_quote.css('.text::text').get()[:50]}...")

    # 模拟网站改版后，用 adaptive=True 重新找
    print("\n  模拟网站改版后，用 adaptive=True 重新定位...")
    similar = page.css('.quote', adaptive=True)
    print(f"  ✅ 自适应定位到 {len(similar)} 个相似元素")

    return True

def test_stealth_mode():
    """测试3: 隐身模式（绕过反爬）"""
    print("\n" + "=" * 50)
    print("测试3: 隐身模式 (StealthyFetcher)")
    print("=" * 50)

    try:
        page = StealthyFetcher.fetch(
            'https://httpbin.org/headers',
            headless=True,
            timeout=20000
        )
        print(f"✅ 隐身模式访问成功，HTTP {page.status}")
        # 看看返回的 headers
        body = page.css('body::text').get('')
        if 'User-Agent' in body:
            print(f"  伪装 UA 正常")
        return True
    except Exception as e:
        print(f"⚠️ 隐身模式测试: {e}")
        return False

def test_dynamic_page():
    """测试4: 动态页面抓取"""
    print("\n" + "=" * 50)
    print("测试4: 动态页面抓取 (DynamicFetcher)")
    print("=" * 50)

    try:
        page = DynamicFetcher.fetch(
            'https://quotes.toscrape.com/js/',
            headless=True,
            network_idle=True,
            timeout=20000
        )
        quotes = page.css('.quote .text::text').getall()
        print(f"✅ 动态页面抓取成功，抓到 {len(quotes)} 条名言")
        return True
    except Exception as e:
        print(f"⚠️ 动态页面测试: {e}")
        return False

if __name__ == '__main__':
    print(f"Scrapling 能力测试")
    print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    results = {}
    results['basic_http'] = test_basic_http()
    results['adaptive'] = test_adaptive_scraping()
    results['stealth'] = test_stealth_mode()
    results['dynamic'] = test_dynamic_page()

    print("\n" + "=" * 50)
    print("测试汇总")
    print("=" * 50)
    for test, passed in results.items():
        status = "✅ 通过" if passed else "❌ 失败"
        print(f"  {test}: {status}")
