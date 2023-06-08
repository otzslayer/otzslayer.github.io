---
title: SOLID한 코드를 작성하기 위한 다섯 가지 원칙
tags: [solid, clean-code]
category: Python
aside:
  toc: true
show_category: true
---

SOLID 원칙이란 '클린 코드'의 저자인 로버트 마틴이 명명한 객체 지향 프로그래밍의 다섯 가지 기본 원칙입니다.

<!--more-->


## SOLID 디자인 원칙

- SOLID는 각 기본 원칙의 앞글자
- 훨씬 단순하고, 이해하기 쉬우며, 유지보수에 용이하고, 확장성이 높은 코드를 작성하도록 도와줌

### 1. Single Responsibility Principle (단일 책임 원칙, SRP)

> *어떤 클래스를 변경해야 하는 이유는 오직 단 하나 뿐이어야 한다.  
(A class should have one, and only one, reason to change.)*

- 변경해야 하는 이유가 오직 하나 뿐이라는 것은 **"오직 하나의 책임만 가지고 있다"**는 것을 의미함
    - 클래스가 복잡할 수록 코드 변경 시 예기치 않은 결과를 초래하게 됨
- 코드를 더 강건하고 유연하게, 이해하기 쉽게 작성할 수 있고 코드 변경 시 예기치 않은 부작용을 방지할 수 있음

```python
class Album:
    def __init__(self, name, artist, songs) -> None:
        self.name = name
        self.artist = artist
        self.songs = songs

    def add_song(self, song):
        self.songs.append(song)

    def remove_song(self, song):
        self.songs.remove(song) 

    def __str__(self) -> str:
        return f"Album {self.name} by {self.artist}\nTracklist:\n{self.songs}"

    # breaks the SRP
    def search_album_by_artist(self):
        """ Searching the database for other albums by same artist """
        pass
```

- `Album` 클래스는 앨범명, 아티스트, 트랙 리스트를 저장하고 곡 추가/제거와 같은 조작을 함
- 여기에 같은 아티스트의 앨범을 찾는 함수를 추가하면 **단일책임원칙을 어기게 됨**
    - 앨범 내용을 수정하는 책임과 앨범을 검색하는 책임 두 가지를 갖고 있게 됨
    - 다른 클래스를 하나 만드는 방법이 있음

```python
# instead:
class AlbumBrowser:
	""" Class for browsing the Albums database"""
    def search_album_by_artist(self, albums, artist):
    	pass

    def search_album_starting_with_letter(self, albums, letter):
    	pass
```

- **주의점**
    - 이 원칙은 모든 클래스가 하나의 메소드에서와 같이 *하나의 단일 작업*을 수행해야 한다는 의미가 아니라 *하나의 컨셉*을 갖고 있어야 한다는 의미임
        - 클래스를 너무 단순하게 만들면 읽기도 어려워지고 코드베이스가 파편화(fragmented)될 수 있음

### 2. Open-Closed Principle (개발 폐쇄 원칙, OCP)

> *소프트웨어 개체(패키지, 모듈, 함수 등)은 확장에 대해선 개방적이되 변경에 대해서는 폐쇄적이어야 한다.  
(Software entities (classes, modules, functions, etc.) should be open for extension, but closed for modification.*

- **기존 코드 구조의 변경 없이** 새로운 코드를 작성하여 새로운 기능을 추가하는 것이 가능해야 함
    - 버그를 방지하고 모든 것을 다시 테스트하는 일이 없도록 기존의 테스트된 코드를 최대한 적게 변경하도록 하는 것
- `if-else` 구문이 있는 경우에 OCP가 위반되는 경우가 많음

```python
class Album:
    def __init__(self, name, artist, songs, genre):
        self.name = name
        self.artist = artist
        self.songs = songs
        self.genre = genre
#before
class AlbumBrowser:
    def search_album_by_artist(self, albums, artist):
        return [album for album in albums if album.artist == artist]

    def search_album_by_genre(self, albums, genre):
        return [album for album in albums if album.genre == genre]
```

- 위 같은 방법으로 코드를 작성하면 앨범 검색 로직이 늘어날 때마다 코드가 기하급수적으로 증가함
- 이를 해결하기 위해 공통 인터페이스를 포함하는 베이스 클래스를 정의하고, 그 후에 각 상세에 맞춰 베이스 클래스를 상속하는 서브 클래스를 정의함

```python
#after
class SearchBy:
    def is_matched(self, album):
        pass
      

class SearchByGenre(SearchBy):
    def __init__(self, genre):
        self.genre = genre

    def is_matched(self, album):
        return album.genre == self.genre
    

class SearchByArtist(SearchBy):
    def __init__(self, artist):
        self.artist = artist

    def is_matched(self, album):
        return album.artist == self.artist
    

class AlbumBrowser:
    def browse(self, albums, searchby):
        return [album for album in albums if searchby.is_matched(album)]
```

- 여러 조건을 함께 탐색하는 것은 위 코드로는 불가능함
    - 매직 메서드 중에서 `__and__`를 사용하면 됨

```python
#add __and__:
class SearchBy:
    def is_matched(self, album):
        pass

    def __and__(self, other):
        return AndSearchBy(self, other)


class AndSearchBy(SearchBy):
    def __init__(self, searchby1, searchby2):
        self.searchby1 = searchby1
        self.searchby2 = searchby2

    def is_matched(self, album):
        return self.searchby1.is_matched(album) and self.searchby2.is_matched(album)
```

- 두 조건에 대해서 `&`으로 묶을 수 있음

```python
LAWoman = Album(
    name="L.A. Woman",
    artist="The Doors",
    songs=["Riders on the Storm"],
    genre="Rock",
)
Trash = Album(
    name="Trash",
    artist="Alice Cooper",
    songs=["Poison"],
    genre="Rock",
)
albums = [LAWoman, Trash]
# this creates the AndSearchBy object
my_search_criteria = SearchByGenre(genre="Rock") & SearchByArtist(
    artist="The Doors"
)
browser = AlbumBrowser()
assert browser.browse(albums=albums, searchby=my_search_criteria) == [LAWoman]
# yay we found our album
```

### 3. Liskov Substituion Principle (리스코프 치환 원칙, LSP)

> _$q(x)$를 자료형 $T$의 객체 $x$에 대해 증명할 수 있는 속성이라고 하자. 그렇다면 $S$가 $T$의 하위형이라면 $q(y)$는 자료형 $S$의 객체 $y$에 대해 증명할 수 있어야 한다._  
_(Let $q(x)$ be a property provable about objects $x$ of type $T$. Then $q(y)$ should be true for objects $y$ of type $S$ where $S$ is a subtype of $T$.)_

- 베이스 클래스 $T$와 그에 대한 서브클래스 $S$가 있다면, 코드의 변경 없이 메인 클래스를 서브클래스로 치환할 수 있어야 함
    - 베이스 클래스와 서브클래스의 인터페이스가 동일할 것이기 때문
    - 서브클래스의 결과는 베이스 클래스의 부분집합일 수는 있으나 그 형태는 동일해야 함
- 결국 클래스 상속에 대한 원칙임
    - LSP는 항상 OCP와 함께 고려되어야 함

```python
class Rectangle:
    def __init__(self, height, width):
        self._height = height
        self._width = width

    @property
    def width(self):
        return self._width

    @width.setter
    def width(self, value):
        self._width = value

    @property
    def height(self):
        return self._height

    @height.setter
    def height(self, value):
        self._height = value

    def get_area(self):
        return self._width * self._height

class Square(Rectangle):
    def __init__(self, size):
        Rectangle.__init__(self, size, size)

    @Rectangle.width.setter
    def width(self, value):
        self._width = value
        self._height = value

    @Rectangle.height.setter
    def height(self, value):
        self._width = value
        self._height = value

def get_squashed_height_area(Rectangle):
    Rectangle.height = 1
    area = Rectangle.get_area()
    return area

rectangle = Rectangle(5, 5)
square = Square(5)

assert get_squashed_height_area(rectangle) == 5  # expected 5
assert get_squashed_height_area(square) == 1  # expected 5
```

- `Square`가 `Rectangle`을 상속받고 있지만 LSP를 위반하고 있음
- 짧은 코드에선 문제가 없을 수 있으나 함수나 구조가 복잡해지기 시작하면 문제가 커짐

### 4. Interface Segregation Principle (인터페이스 분리 원칙, ISP)

> *클라이언트는 자신이 사용하지 않은 인터페이스에 의존 관계를 가지면 안된다.  
(Clients should not be forced to depend upon interfaces that they do not use.)*

- 많은 메서드가 포함되어 있는 베이스 클래스가 있을 때, 그 서브클래스가 부모 클래스의 모든 메서드를 필요로 하지 않는 경우가 있음
    - 필요도 없는데 상속으로 인해 해당 메서드를 갖게 되고 버그를 만들 수도 있음
- **최대한 인터페이스를 작게 만들어서 필요 없는 메서드를 갖지 않도록 하는 원칙**

```python
class PlaySongs:
    def __init__(self, title):
        self.title = title
    def play_drums(self):
        print("Ba-dum ts")
    def play_guitar(self):
        print("*Soul-moving guitar solo*")
    def sing_lyrics(self):
        print("NaNaNaNa")


# This class is fine, just changing the guitar and lyrics
class PlayRockSongs(PlaySongs): 
    def play_guitar(self):
        print("*Very metal guitar solo*")
    def sing_lyrics(self):
        print("I wanna rock and roll all night")


# This breaks the ISP, we don't have lyrics 
class PlayInstrumentalSongs(PlaySongs):
    def sing_lyrics(self):
        raise Exception("No lyrics for instrumental songs")
```

- 위 예의 경우 `PlayInstrumentalSongs` 클래스는 `sing_lyrics` 메서드가 필요가 없으나 부모 클래스인 `PlaySongs` 을 상속 받아 불필요한 메서드를 갖게 됨

```python
class PlaySongsLyrics:
    @abstractmethod
    def sing_lyrics(self, title):
        pass


class PlaySongsMusic:
    @abstractmethod
    def play_guitar(self, title):
        pass

    @abstractmethod
    def play_drums(self, title):
        pass


class PlayInstrumentalSong(PlaySongsMusic):
    def play_drums(self, title):
        print("Ba-dum ts")
        
    def play_guitar(self, title):
        print("*Soul-moving guitar solo*")

class PlayRockSong(PlaySongsMusic, PlaySongsLyrics):
    def play_guitar(self):
        print("*Very metal guitar solo*")

    def sing_lyrics(self):
        print("I wanna rock and roll all night")

    def play_drums(self, title):
        print("Ba-dum ts")
```

- 가사와 관련된 클래스와 음악과 관련된 클래스를 따로 만들어 상속 받기 때문에 각 클래스의 메서드가 불필요하지 않아 ISP를 위반하지 않음

### 5. Dependency Inversion Principle (의존 역전 원칙, DIP)

> *고레벨 모듈은 저레벨 모듈에 의존하여선 안된다. 두 모듈 모두 추상화된 것에 의존해야 한다. (인터페이스 등)*  
*High-level modules should not depend on low-level modules. Both should depend on abstractions (e.g. interfaces).*  
> *추상화된 것은 구체적인 것에 의존하여선 안된다. 구체적인 것이 추상화된 것에 의존해야 한다.*  
*Abstractions should not depend on details. Details (concrete implementations) should depend on abstractions.*

- 만약 현재 코드가 잘 추상화되어 있는 인터페이스를 갖고 있다면, 특정 클래스의 내부 로직을 변경하더라도 코드는 올바르게 작동함

```python
class AlbumStore:
    albums = []
    def add_album(self, name, artist, genre):
        self.albums.append((name, artist, genre))


class ViewRockAlbums:
    def __init__(self, album_store):
        for album in album_store.albums:
            if album[2] == "Rock":
                print(f"We have {album[0]} in store.")
```

- `AlbumStore` 클래스에서 앨범을 추가할 때 튜플의 순서를 바꾸면 전체 코드는 작동하지 않게 됨
    - `ViewRockAlbums` 클래스에서 제대로 된 앨범명을 출력할 수 없음
    - 이 경우 DIP를 위배함
- 추상화된 인터페이스를 추가하여 구체적인 부분을 추상화한 것에 의존하도록 만듦

```python
class GeneralAlbumStore:
    @abstractmethod
    def filter_by_genre(self, genre):
        pass


class MyAlbumStore(GeneralAlbumStore):
    albums = []
    def add_album(self, name, artist, genre):
        self.albums.append((name, artist, genre))

    def filter_by_genre(self, genre):
        if album[2] == genre:
            yield album[0]


class ViewRockAlbums:
    def __init__(self, album_store):
        for album_name in album_store.filter_by_genre("Rock"):
            print(f"We have {album_name} in store.")
```

- 구체적인 클래스인 `MyAlbumStore`가 `GeneralAlbumStore`를 상속받도록 하고, `MyAlbumStore`는 클래스만의 탐색 메서드를 추가하여 DIP를 만족 시킴

---

## Reference
[Towards Data Science](https://towardsdatascience.com/5-principles-to-write-solid-code-examples-in-python-9062272e6bdc)