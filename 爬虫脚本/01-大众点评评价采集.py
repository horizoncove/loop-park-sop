"""
LOOP PARK 大众点评评价采集脚本
功能：爬取大众点评上关于 LOOP PARK / 沣西新城 相关的评价信息
"""

from scrapling.fetchers import StealthyFetcher
import json
from datetime import datetime

def crawl_dianping():
    print("=" * 50)
    print("LOOP PARK 大众点评评价采集")
    print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)

    # 先试试能不能打开大众点评首页
    print("\n[1/3] 测试访问大众点评...")
    try:
        page = StealthyFetcher.fetch(
            'https://www.dianping.com/',
            headless=True,
            solve_cloudflare=True,
            timeout=30000
        )
        print(f"  ✅ 访问成功，HTTP {page.status}")
        print(f"  页面标题: {page.css('title::text').get('无标题')}")
    except Exception as e:
        print(f"  ❌ 访问失败: {e}")
        return

    # 尝试搜索 LOOP PARK
    print("\n[2/3] 尝试搜索 LOOP PARK...")
    # 大众点评搜索 URL 格式
    search_url = 'https://www.dianping.com/search/keyword/17/0_LOOP%20PARK'
    try:
        page = StealthyFetcher.fetch(
            search_url,
            headless=True,
            solve_cloudflare=True,
            timeout=30000
        )
        print(f"  ✅ 搜索页加载成功，HTTP {page.status}")

        # 提取商家信息
        shops = page.css('.shop-list .shop')
        print(f"  找到 {len(shops)} 个相关商家")

        results = []
        for shop in shops[:10]:  # 先取前10个
            name = shop.css('.shopname::text').get('未知')
            addr = shop.css('.addr::text').get('未知')
            stars = shop.css('.star::attr(class)').get('')
            review_count = shop.css('.review-num::text').get('0')

            results.append({
                'name': name.strip(),
                'address': addr.strip(),
                'stars': stars,
                'review_count': review_count.strip()
            })

        # 保存结果
        output_file = f'C:\\Users\\Administrator\\Desktop\\LOOP-PARK-SOP\\爬虫脚本\\dianping_results_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        print(f"\n[3/3] 结果已保存到: {output_file}")
        print("\n--- 前3条结果 ---")
        for i, r in enumerate(results[:3], 1):
            print(f"{i}. {r['name']}")
            print(f"   地址: {r['address']}")
            print(f"   评价数: {r['review_count']}")

    except Exception as e:
        print(f"  ❌ 搜索失败: {e}")

if __name__ == '__main__':
    crawl_dianping()
