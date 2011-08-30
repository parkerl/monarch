(function(Monarch) {
  Monarch.Relations.Projection = new JS.Class('Monarch.Relations.Projection', Monarch.Relations.Relation, {
    initialize: function(operand, table) {
      this.operand = operand;
      this.table = table.isA(JS.Class) ? table.table : table;
      this.buildOrderByExpressions();
      this.recordCounts = new JS.Hash();
      this.recordCounts.setDefault(0);
    },

    all: function() {
      var tableName = this.table.name;
      return this.operand.map(function(composite) {
        return composite.getRecord(tableName);
      }, this);
    },

    buildOrderByExpressions: function() {
      var tableName = this.table.name;
      this.orderByExpressions = _.filter(this.operand.orderByExpressions, function(orderByExpression) {
        return orderByExpression.column.table.name === tableName;
      });
    },

    _activate: function() {
      this.operand.activate();
      this.callSuper();
      var tableName = this.table.name;

      this.subscribe(this.operand, 'onInsert', function(tuple, _, key) {
        this.insert(tuple.getRecord(tableName), key);
      });

      this.subscribe(this.operand, 'onUpdate', function(tuple, changeset, _, _, newKey, oldKey) {
        if (this.changesetInProjection(changeset)) {
          this.tupleUpdated(tuple.getRecord(tableName), changeset, newKey, oldKey);
        }
      });

      this.subscribe(this.operand, 'onRemove', function(tuple, _, oldKey) {
        this.remove(tuple.getRecord(tableName), oldKey);
      });
    },

    insert: function(record, newKey) {
      var rc = this.recordCounts;
      var count = rc.put(record, rc.get(record) + 1);
      if (count === 1) this.callSuper(record, newKey);
    },

    remove: function(record, oldKey) {
      var rc = this.recordCounts;
      var count = rc.put(record, rc.get(record) - 1);
      if (count === 0) {
        rc.remove(record);
        this.callSuper(record, oldKey);
      }
    },

    changesetInProjection: function(changeset) {
      return _.values(changeset)[0].column.table.name === this.table.name;
    }
  });

  Monarch.Relations.Projection.deriveEquality('operand', 'table');
})(Monarch);