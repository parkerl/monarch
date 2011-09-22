describe("Monarch.Remote.FakeServer", function() {

  var fakeServer;

  beforeEach(function() {
    Blog = new JS.Class('Blog', Monarch.Record);
    Blog.columns({
      title: 'string',
      createdAt: 'datetime'
    });

    Monarch.useFakeServer();
    fakeServer = Monarch.Remote.Server;
  });

  afterEach(function() {
    Monarch.restoreOriginalServer();
  });

  describe("creation with the fake server installed", function() {
    it("stores a simulated create request, which can be explicitly completed", function() {
      var promise = Blog.create({title: "Alpha", createdAt: new Date(12345)});
      expect(jQuery.ajax).not.toHaveBeenCalled();

      expect(fakeServer.creates.length).toBe(1);
      var createCommand = fakeServer.lastCreate();
      var record = createCommand.record;
      expect(createCommand).toBe(fakeServer.creates[0]);
      expect(record.isA(Blog)).toBeTruthy();
      expect(createCommand.fieldValues).toEqual({title: "Alpha", created_at: 12345});

      var successCallback = jasmine.createSpy("successCallback");
      promise.onSuccess(successCallback);

      createCommand.succeed();
      expect(successCallback).toHaveBeenCalledWith(record);
      expect(record.id()).toBe(1);
      expect(Blog.find(1)).toBe(record);

      // auto-selects the next available id
      Blog.created({id: 5, title: "Bravo"});
      Blog.create({title: "Charlie", createdAt: new Date(12345)});
      var createCommand2 = fakeServer.lastCreate();
      createCommand2.succeed();
      expect(createCommand2.record.id()).toBe(6);
    });

    it("allows simulated response values from the server to be specified for succeed", function() {
      Blog.create({title: "Alpha", createdAt: new Date(12345)});
      var createCommand = fakeServer.lastCreate();

      createCommand.succeed({
        id: 22,
        title: "Zulu",
        created_at: 98765
      });

      var record = createCommand.record;
      expect(record.id()).toBe(22);
      expect(record.title()).toBe("Zulu");
      expect(record.createdAt().getTime()).toBe(98765);
    });

    it("removes the command from the 'creates' array when the create succeeds", function() {
      Blog.create({title: "Alpha", createdAt: new Date(12345)});
      fakeServer.lastCreate().succeed();
      expect(fakeServer.creates.length).toBe(0);

      Blog.create({title: "Bravo"});
      var create1 = fakeServer.lastCreate();
      Blog.create({title: "Charlie"});
      var create2 = fakeServer.lastCreate();

      create1.succeed();

      expect(fakeServer.creates.length).toBe(1);
      expect(fakeServer.lastCreate()).toBe(create2);
    });
  });

  describe("updates with the fake server installed", function() {
    it("stores a simulated update request, which can be explicitly completed", function() {
      var blog = Blog.created({id: 1, title: "Alpha", createdAt: new Date(12345)});
      var promise = blog.update({title: "Bravo", createdAt: new Date(54321)});
      expect(jQuery.ajax).not.toHaveBeenCalled();
      expect(blog.getRemoteField('title').getValue()).toBe("Alpha");
      expect(blog.getRemoteField('createdAt').getValue().getTime()).toBe(12345);

      expect(fakeServer.updates.length).toBe(1);
      var updateCommand = fakeServer.lastUpdate();
      expect(updateCommand).toBe(fakeServer.updates[0]);
      expect(updateCommand.record).toBe(blog);
      expect(updateCommand.fieldValues).toEqual({title: "Bravo", created_at: 54321});

      var successCallback = jasmine.createSpy("successCallback");
      promise.onSuccess(successCallback);

      updateCommand.succeed();
      expect(successCallback).toHaveBeenCalled();
      expect(successCallback.arg(0)).toBe(blog);
      expect(successCallback.arg(1)).toEqual({
        title: {
          oldValue: "Alpha",
          newValue: "Bravo",
          column: Blog.getColumn('title')
        },
        createdAt: {
          oldValue: new Date(12345),
          newValue: new Date(54321),
          column: Blog.getColumn('createdAt')

        }
      });

      expect(blog.title()).toBe("Bravo");
      expect(blog.createdAt().getTime()).toBe(54321);
    });


    it("allows simulated response values from the server to be specified for succeed", function() {
      var blog = Blog.created({id: 1, title: "Alpha", createdAt: new Date(12345)});
      blog.update({title: "Bravo", createdAt: new Date(54321)});

      Blog.create({title: "Alpha", createdAt: new Date(12345)});
      var updateCommand = fakeServer.lastUpdate();

      updateCommand.succeed({
        title: "Zulu",
        created_at: 98765
      });

      expect(blog.title()).toBe("Zulu");
      expect(blog.createdAt().getTime()).toBe(98765);
    });

    it("removes the command from the 'creates' array when the create succeeds", function() {
      var blog = Blog.created({id: 1, title: "Alpha", createdAt: new Date(12345)});
      blog.update({title: "Bravo", createdAt: new Date(54321)});
      fakeServer.lastUpdate().succeed();
      expect(fakeServer.updates.length).toBe(0);

      blog.update({title: "Bravo"});
      var update1 = fakeServer.lastUpdate();
      blog.update({title: "Charlie"});
      var update2 = fakeServer.lastUpdate();

      update1.succeed();

      expect(fakeServer.updates.length).toBe(1);
      expect(fakeServer.lastUpdate()).toBe(update2);
    });
  });
});